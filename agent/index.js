const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const winston = require('winston');
const { z } = require('zod');
const { randomBytes } = require('crypto');
const os = require('os');
const AdbService = require('./adb-service');
const MuMuService = require('./mumu-service');
const ScreenshotService = require('./screenshot-service');
const VisionService = require('./vision-service');
const MissionEngine = require('./mission-engine');
require('dotenv').config();

// CONFIGURATION & LOGGING
const CONFIG_PATH = path.join(os.homedir(), '.warpath', 'agent.json');
const LOG_DIR = path.join(os.homedir(), '.warpath', 'logs');
fs.ensureDirSync(path.dirname(CONFIG_PATH));
fs.ensureDirSync(LOG_DIR);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// TYPES
const CommandStatus = z.enum(["SUCCESS", "FAILED", "TIMEOUT", "NOT_IMPLEMENTED"]);
const AgentStatus = z.enum(["ONLINE", "OFFLINE", "UNKNOWN"]);

class WarpathAgent {
    constructor() {
        this.baseUrl = process.env.WARPATH_API_URL || 'http://localhost:8080/api/public/agent';
        this.registrationKey = process.env.AGENT_REGISTRATION_KEY || 'warpath-secret-key-change-me';
        this.agentId = null;
        this.token = null;
        this.isShuttingDown = false;
        this.heartbeatInterval = null;
        this.commandInterval = null;
        this.discoveryInterval = null;
        
        this.adb = new AdbService(logger, { adbPath: process.env.ADB_PATH });
        this.mumu = new MuMuService(logger, { mumuPath: process.env.MUMU_PATH });
        this.screenshot = new ScreenshotService(logger, this.adb);
        this.vision = new VisionService(logger, this);
        this.missionEngine = new MissionEngine(logger, this);
    }

    /**
     * Helper to call a server function via the API proxy
     */
    async callServerFunction(name, data) {
        const response = await axios.post(`${this.baseUrl}/rpc`, {
            functionName: name,
            payload: data
        });
        return response.data;
    }


    async init() {
        logger.info('Starting WARPATH Agent...');
        await this.loadConfig();
        
        if (!this.agentId || !this.token) {
            await this.register();
        }

        this.setupProcessHandlers();
        this.startHeartbeat();
        this.startCommandPolling();
        this.startDiscovery();
        
        await this.sendEvent('AGENT_STARTED', { 
            hostname: os.hostname(),
            adbAvailable: await this.adb.isAvailable()
        });
    }

    async loadConfig() {
        if (await fs.pathExists(CONFIG_PATH)) {
            const config = await fs.readJson(CONFIG_PATH);
            this.agentId = config.agentId;
            this.token = config.token;
            logger.info('Loaded existing agent configuration', { agentId: this.agentId });
        }
    }

    async saveConfig() {
        await fs.writeJson(CONFIG_PATH, {
            agentId: this.agentId,
            token: this.token
        });
    }

    async register() {
        logger.info('Registering agent with platform...');
        try {
            const installationId = randomBytes(16).toString('hex');
            const response = await axios.post(`${this.baseUrl}/register`, {
                registrationKey: this.registrationKey,
                name: `Agent-${os.hostname()}`,
                hostname: os.hostname(),
                version: '1.0.0',
                installationId
            });

            this.agentId = response.data.agentId;
            this.token = response.data.token;
            await this.saveConfig();
            logger.info('Agent registered successfully', { agentId: this.agentId });
        } catch (error) {
            logger.error('Registration failed', { error: error.message });
            process.exit(1);
        }
    }

    startHeartbeat() {
        const sendHeartbeat = async () => {
            if (this.isShuttingDown) return;
            try {
                await axios.post(`${this.baseUrl}/heartbeat`, {
                    agentId: this.agentId,
                    token: this.token,
                    version: '1.0.0',
                    status: 'ONLINE'
                });
                logger.debug('Heartbeat sent');
            } catch (error) {
                logger.warn('Heartbeat failed', { error: error.message });
            }
        };

        sendHeartbeat();
        this.heartbeatInterval = setInterval(sendHeartbeat, 30000); // 30s
    }

    startCommandPolling() {
        const pollCommands = async () => {
            if (this.isShuttingDown) return;
            try {
                const response = await axios.post(`${this.baseUrl}/commands`, {
                    agentId: this.agentId,
                    token: this.token
                });

                const commands = response.data;
                if (commands && commands.length > 0) {
                    logger.info(`Received ${commands.length} pending commands`);
                    for (const cmd of commands) {
                        await this.dispatchCommand(cmd);
                    }
                }
            } catch (error) {
                logger.error('Command polling failed', { error: error.message });
            }
        };

        pollCommands();
        this.commandInterval = setInterval(pollCommands, 5000); // 5s
    }

    async startDiscovery() {
        const discover = async () => {
            if (this.isShuttingDown) return;
            try {
                const adbDevices = await this.adb.getDevices();
                const mappedDevices = this.mumu.mapAdbToMuMu(adbDevices);

                for (const device of mappedDevices) {
                    if (device.type === 'MUMU') {
                        const info = await this.adb.getDeviceInfo(device.serial);
                        await this.sendEvent('EMULATOR_DISCOVERED', {
                            adbSerial: device.serial,
                            instanceName: device.instanceName,
                            status: device.state === 'device' ? 'ONLINE' : 'OFFLINE',
                            resolution: info.resolution,
                            dpi: info.dpi
                        });
                    } else {
                        const info = await this.adb.getDeviceInfo(device.serial);
                        await this.sendEvent('DEVICE_DISCOVERED', {
                            serial: device.serial,
                            model: info.model,
                            androidVersion: info.androidVersion,
                            status: device.state === 'device' ? 'ONLINE' : 'OFFLINE'
                        });
                    }
                }
            } catch (error) {
                logger.error('Discovery cycle failed', { error: error.message });
            }
        };

        discover();
        this.discoveryInterval = setInterval(discover, 60000); // Every 1m
    }

    async dispatchCommand(command) {
        logger.info('Executing command', { id: command.id, type: command.command_type });
        
        try {
            switch (command.command_type) {
                case 'ADB_DEVICES': {
                    const devices = await this.adb.getDevices();
                    await this.reportCommandResult(command.id, 'SUCCESS', { devices });
                    break;
                }
                case 'ADB_GET_STATE': {
                    const { serial } = command.payload || {};
                    const result = await this.adb.execute('get-state', serial);
                    await this.reportCommandResult(command.id, result.success ? 'SUCCESS' : 'FAILED', { state: result.stdout });
                    break;
                }
                case 'ADB_GET_SCREEN_SIZE': {
                    const { serial } = command.payload || {};
                    const result = await this.adb.execute('shell wm size', serial);
                    await this.reportCommandResult(command.id, result.success ? 'SUCCESS' : 'FAILED', { 
                        resolution: result.stdout ? result.stdout.replace('Physical size: ', '') : 'Unknown'
                    });
                    break;
                }
                case 'ADB_GET_DENSITY': {
                    const { serial } = command.payload || {};
                    const result = await this.adb.execute('shell wm density', serial);
                    await this.reportCommandResult(command.id, result.success ? 'SUCCESS' : 'FAILED', { 
                        dpi: result.stdout ? parseInt(result.stdout.replace('Physical density: ', '')) : null
                    });
                    break;
                }
                case 'TAKE_SCREENSHOT': {
                    const { serial } = command.payload || {};
                    const buffer = await this.screenshot.capture(serial);
                    const validation = await this.screenshot.validate(buffer);
                    
                    if (!validation.valid) {
                        await this.reportCommandResult(command.id, 'FAILED', { 
                            error: validation.error,
                            actual: validation.actual
                        });
                    } else {
                        // For diagnostic screenshots, we send base64 back in the result payload
                        // This is ONLY for Admin manual requests.
                        await this.reportCommandResult(command.id, 'SUCCESS', { 
                            screenshot: buffer.toString('base64'),
                            width: validation.width,
                            height: validation.height
                        });
                    }
                    break;
                }
                case 'TEST_VISION_RULE': {
                    const { serial, rule, assetUrl } = command.payload || {};
                    
                    // 1. Capture & Validate
                    const buffer = await this.screenshot.capture(serial);
                    const validation = await this.screenshot.validate(buffer);
                    if (!validation.valid) {
                        await this.reportCommandResult(command.id, 'FAILED', { error: validation.error });
                        break;
                    }

                    // 2. Fetch template
                    const templateResponse = await axios.get(assetUrl, { responseType: 'arraybuffer' });
                    const templateImage = await Jimp.read(templateResponse.data);

                    // 3. Process
                    const result = await this.vision.findTemplate(
                        validation.image, 
                        templateImage, 
                        rule.threshold || 0.8
                    );

                    // 4. Report
                    await this.reportCommandResult(command.id, 'SUCCESS', {
                        ...result,
                        screenshot: buffer.toString('base64') // Optional: return for UI visualization
                    });

                    // 5. Send telemetry event
                    await this.sendEvent('VISION_RUN_COMPLETED', {
                        rule_id: rule.id,
                        device_serial: serial,
                        ...result
                    });

                    break;
                }
                case 'GET_RECOVERY_RULES': {
                    const { triggerType } = command.payload || {};
                    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                    
                    const { data: rules } = await supabaseAdmin
                      .from("recovery_rules")
                      .select("*")
                      .eq("trigger_type", triggerType)
                      .eq("active", true)
                      .order("priority", { ascending: false });

                    await this.reportCommandResult(command.id, 'SUCCESS', { rules: rules || [] });
                    break;
                }
                case 'EXECUTE_MISSION': {
                    const { emulatorId, missionRunId, steps } = command.payload || {};
                    if (!emulatorId || !missionRunId || !steps) {
                        await this.reportCommandResult(command.id, 'FAILED', { error: 'Missing mission parameters' });
                        break;
                    }
                    
                    // Respond SUCCESS immediately that the mission was accepted/started
                    await this.reportCommandResult(command.id, 'SUCCESS', { message: 'Mission execution started' });
                    
                    // Run mission in background
                    this.missionEngine.executeMission(emulatorId, missionRunId, steps).catch(err => {
                        logger.error('Background mission execution failed', { missionRunId, error: err.message });
                    });
                    break;
                }
                default:
                    await this.reportCommandResult(command.id, 'NOT_IMPLEMENTED', {
                        message: `Command type ${command.command_type} not implemented`
                    });
            }
        } catch (error) {
            logger.error('Command dispatcher error', { id: command.id, error: error.message });
            await this.reportCommandResult(command.id, 'FAILED', { error: error.message });
        }
    }

    async reportCommandResult(commandId, status, payload = {}) {
        try {
            await axios.post(`${this.baseUrl}/events`, {
                agentId: this.agentId,
                token: this.token,
                eventType: 'COMMAND_COMPLETED',
                payload: { commandId, status, ...payload }
            });
            logger.info('Command result reported', { commandId, status });
        } catch (error) {
            logger.error('Failed to report command result', { error: error.message });
        }
    }

    async sendEvent(eventType, payload = {}) {
        try {
            await axios.post(`${this.baseUrl}/events`, {
                agentId: this.agentId,
                token: this.token,
                eventType,
                payload
            });
        } catch (error) {
            logger.warn('Failed to send event', { eventType, error: error.message });
        }
    }

    setupProcessHandlers() {
        const shutdown = async () => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            logger.info('Shutting down gracefully...');
            
            clearInterval(this.heartbeatInterval);
            clearInterval(this.commandInterval);
            clearInterval(this.discoveryInterval);
            
            await this.sendEvent('AGENT_STOPPED', { reason: 'Graceful shutdown' });
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}

const agent = new WarpathAgent();
agent.init().catch(err => {
    logger.error('Fatal initialization error', { error: err.message });
    process.exit(1);
});
