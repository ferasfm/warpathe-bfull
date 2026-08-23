const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const winston = require('winston');
const { z } = require('zod');
const { randomBytes } = require('crypto');
const os = require('os');
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
        
        await this.sendEvent('AGENT_STARTED', { hostname: os.hostname() });
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

    async dispatchCommand(command) {
        logger.info('Executing command', { id: command.id, type: command.command_type });
        
        // REPORT AS NOT IMPLEMENTED IN PHASE 07
        await this.reportCommandResult(command.id, 'NOT_IMPLEMENTED', {
            message: 'Physical automation drivers not installed in this version'
        });
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
