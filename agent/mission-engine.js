const Jimp = require('jimp-compact');
const axios = require('axios');
const WatchdogService = require('./watchdog-service');

class MissionEngine {
    constructor(logger, agent) {
        this.logger = logger;
        this.agent = agent;
        this.runningMissions = new Map(); // emulator_id -> mission_run_id
    }

    async executeMission(emulatorId, missionRunId, steps) {
        if (this.runningMissions.has(emulatorId)) {
            throw new Error(`DEVICE_BUSY: Mission already running on emulator ${emulatorId}`);
        }

        this.runningMissions.set(emulatorId, missionRunId);
        this.logger.info('Starting mission execution', { emulatorId, missionRunId, stepCount: steps.length });

        try {
            let currentStepIndex = 0;
            while (currentStepIndex < steps.length) {
                const step = steps[currentStepIndex];
                this.logger.info(`Executing step ${currentStepIndex + 1}/${steps.length}`, { stepType: step.step_type });

                await this.reportStepProgress(missionRunId, step.id, 'RUNNING');

                try {
                    const result = await this.executeStep(emulatorId, step);
                    
                    if (result.status === 'SUCCESS') {
                        await this.reportStepProgress(missionRunId, step.id, 'COMPLETED', result.payload);
                        
                        // Handle conditional branching
                        if (step.step_type === 'CONDITION' && result.nextStepId) {
                            const nextIndex = steps.findIndex(s => s.id === result.nextStepId);
                            if (nextIndex !== -1) {
                                currentStepIndex = nextIndex;
                                continue;
                            }
                        }
                    } else if (result.status === 'RETRY') {
                        this.logger.warn(`Step requested retry`, { stepId: step.id });
                        // Simple retry logic could be added here, but for now we follow step order
                    } else {
                        throw new Error(result.error || 'Step failed');
                    }
                } catch (stepError) {
                    this.logger.error(`Step execution failed`, { stepId: step.id, error: stepError.message });
                    await this.reportStepProgress(missionRunId, step.id, 'FAILED', { error: stepError.message });
                    throw stepError;
                }

                currentStepIndex++;
            }

            await this.reportMissionResult(missionRunId, 'COMPLETED');
            this.logger.info('Mission completed successfully', { missionRunId });
        } catch (error) {
            this.logger.error('Mission failed', { missionRunId, error: error.message });
            await this.reportMissionResult(missionRunId, 'FAILED', error.message);
        } finally {
            this.runningMissions.delete(emulatorId);
        }
    }

    async executeStep(emulatorId, step) {
        const { step_type, params } = step;

        switch (step_type) {
            case 'WAIT':
                const duration = params.duration || 1000;
                await new Promise(resolve => setTimeout(resolve, duration));
                return { status: 'SUCCESS' };

            case 'SCREENSHOT':
                const buffer = await this.agent.screenshot.capture(emulatorId);
                const validation = await this.agent.screenshot.validate(buffer);
                if (!validation.valid) throw new Error(validation.error);
                return { status: 'SUCCESS', payload: { screenshot: buffer.toString('base64') } };

            case 'FIND_IMAGE':
                return await this.handleFindImage(emulatorId, params);

            case 'TAP':
                return await this.handleTap(emulatorId, params);

            case 'CONDITION':
                return await this.handleCondition(emulatorId, params);

            case 'END':
                return { status: 'SUCCESS' };

            default:
                throw new Error(`UNKNOWN_ACTION: ${step_type}`);
        }
    }

    async handleFindImage(emulatorId, params) {
        const { assetUrl, threshold = 0.8, timeout = 10000, retries = 3 } = params;
        if (!assetUrl) throw new Error('MISSING_PARAMETER: assetUrl');

        let attempt = 0;
        const start = Date.now();

        while (attempt <= retries) {
            try {
                const buffer = await this.agent.screenshot.capture(emulatorId);
                const validation = await this.agent.screenshot.validate(buffer);
                if (!validation.valid) throw new Error(validation.error);

                const templateResponse = await axios.get(assetUrl, { responseType: 'arraybuffer' });
                const templateImage = await Jimp.read(templateResponse.data);

                const result = await this.agent.vision.findTemplate(validation.image, templateImage, threshold);

                if (result.detected) {
                    return { status: 'SUCCESS', payload: result };
                }

                if (Date.now() - start > timeout) break;
            } catch (err) {
                this.logger.warn(`FIND_IMAGE attempt ${attempt} failed`, { error: err.message });
            }

            attempt++;
            if (attempt <= retries) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return { status: 'FAILED', error: 'IMAGE_NOT_FOUND' };
    }

    async handleTap(emulatorId, params) {
        const { x, y, useVisionResult } = params;
        let tapX = x;
        let tapY = y;

        if (useVisionResult) {
            // Logic to get coordinates from previous step result would go here
            // For now, we expect absolute coordinates
        }

        if (tapX === undefined || tapY === undefined) throw new Error('MISSING_PARAMETER: x, y');

        const result = await this.agent.adb.execute(`shell input tap ${tapX} ${tapY}`, emulatorId);
        if (!result.success) throw new Error(`ADB_TAP_FAILED: ${result.error}`);

        return { status: 'SUCCESS' };
    }

    async handleCondition(emulatorId, params) {
        // Simple example: if previous step found an image, go to step A, else step B
        const { check, ifTrue, ifFalse } = params;
        // This requires state tracking of the mission run, which we'll implement as needed.
        // For now, just a placeholder success.
        return { status: 'SUCCESS', nextStepId: ifTrue };
    }

    async reportStepProgress(missionRunId, stepId, status, payload = {}) {
        await this.agent.sendEvent('MISSION_STEP_UPDATE', {
            missionRunId,
            stepId,
            status,
            payload
        });
    }

    async reportMissionResult(missionRunId, status, error = null) {
        await this.agent.sendEvent('MISSION_COMPLETED', {
            missionRunId,
            status,
            error
        });
    }
}

module.exports = MissionEngine;