const axios = require('axios');
const Jimp = require('jimp-compact');

class WatchdogService {
    constructor(logger, agent) {
        this.logger = logger;
        this.agent = agent;
        this.recoveryAttempts = new Map(); // mission_run_id -> count
        this.maxRecoveryAttempts = 3;
        this.recoveryTimeout = 60000; // 1 minute
        this.isRecovering = new Set(); // mission_run_id
    }

    async monitor(emulatorId, missionRunId, currentStep, missionSteps) {
        this.logger.debug('Watchdog heartbeat', { missionRunId, emulatorId });

        // 1. Check ADB Connectivity
        const adbAvailable = await this.agent.adb.isAvailable();
        if (!adbAvailable) {
            throw new Error('WATCHDOG_FATAL: ADB service disconnected');
        }

        const deviceState = await this.agent.adb.execute('get-state', emulatorId);
        if (!deviceState.success || deviceState.stdout !== 'device') {
            return await this.handleRecovery(emulatorId, missionRunId, 'DEVICE_OFFLINE', currentStep, missionSteps);
        }

        // 2. Check for unexpected screens (Vision-based anomaly detection)
        // This would normally be triggered by the mission engine when a step fails,
        // but watchdog can also periodically sample if requested.
        
        return { status: 'HEALTHY' };
    }

    async handleRecovery(emulatorId, missionRunId, triggerType, currentStep, missionSteps) {
        if (this.isRecovering.has(missionRunId)) {
            return { status: 'RECOVERY_IN_PROGRESS' };
        }

        const attempts = (this.recoveryAttempts.get(missionRunId) || 0) + 1;
        if (attempts > this.maxRecoveryAttempts) {
            this.logger.error('Max recovery attempts exceeded', { missionRunId });
            return { status: 'RECOVERY_FAILED', error: 'MAX_ATTEMPTS_EXCEEDED' };
        }

        this.isRecovering.add(missionRunId);
        this.recoveryAttempts.set(missionRunId, attempts);
        this.logger.warn('Triggering recovery flow', { missionRunId, triggerType, attempt: attempts });

        try {
            await this.agent.sendEvent('RECOVERY_STARTED', { missionRunId, triggerType, attempt: attempts });

            // 1. Fetch Recovery Rules from Platform
            const rules = await this.fetchRecoveryRules(triggerType);
            
            if (!rules || rules.length === 0) {
                this.logger.info('No specific recovery rules found, falling back to mission restart');
                return { status: 'RECOVERY_FAILED', error: 'NO_RULES_MATCHED' };
            }

            // 2. Execute Recovery Actions
            for (const rule of rules) {
                this.logger.info('Evaluating recovery rule', { ruleName: rule.name });
                const success = await this.executeRecoveryRule(emulatorId, rule);
                if (success) {
                    this.logger.info('Recovery rule successful', { ruleName: rule.name });
                    
                    // Determine where to resume
                    const resumeAction = rule.configuration?.resumeAction || 'RETRY_CURRENT_STEP';
                    return { status: 'RECOVERED', resumeAction, targetStepId: rule.configuration?.targetStepId };
                }
            }

            return { status: 'RECOVERY_FAILED', error: 'ALL_RULES_FAILED' };
        } catch (error) {
            this.logger.error('Recovery engine error', { error: error.message });
            return { status: 'RECOVERY_FAILED', error: error.message };
        } finally {
            this.isRecovering.delete(missionRunId);
        }
    }

    async fetchRecoveryRules(triggerType) {
        try {
            // In a real scenario, we'd call the platform API
            // For now, we simulate a response based on the trigger
            const response = await axios.post(`${this.agent.baseUrl}/commands`, {
                agentId: this.agent.agentId,
                token: this.agent.token,
                command_type: 'GET_RECOVERY_RULES',
                payload: { triggerType }
            });
            return response.data.rules || [];
        } catch (error) {
            this.logger.error('Failed to fetch recovery rules', { error: error.message });
            return [];
        }
    }

    async executeRecoveryRule(emulatorId, rule) {
        const actions = rule.configuration?.actions || [];
        
        for (const action of actions) {
            this.logger.info('Executing recovery action', { action: action.type });
            
            try {
                switch (action.type) {
                    case 'WAIT':
                        await new Promise(resolve => setTimeout(resolve, action.duration || 2000));
                        break;
                    case 'TAP':
                        await this.agent.adb.execute(`shell input tap ${action.x} ${action.y}`, emulatorId);
                        break;
                    case 'FIND_IMAGE':
                        // Use existing VisionService
                        const buffer = await this.agent.screenshot.capture(emulatorId);
                        const validation = await this.agent.screenshot.validate(buffer);
                        if (!validation.valid) return false;
                        
                        const templateRes = await axios.get(action.assetUrl, { responseType: 'arraybuffer' });
                        const template = await Jimp.read(templateRes.data);
                        const visionRes = await this.agent.vision.findTemplate(validation.image, template, action.threshold || 0.8);
                        if (!visionRes.detected) return false;
                        break;
                    case 'SCREENSHOT':
                        await this.agent.screenshot.capture(emulatorId);
                        break;
                    default:
                        this.logger.warn('Unknown recovery action', { type: action.type });
                }
            } catch (err) {
                this.logger.error('Recovery action failed', { action: action.type, error: err.message });
                return false;
            }
        }
        return true;
    }
}

module.exports = WatchdogService;