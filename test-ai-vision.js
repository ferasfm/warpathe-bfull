const Jimp = require('jimp-compact');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

/**
 * Mock Agent for testing AI Vision Fallback
 */
class MockAgent {
    constructor() {
        this.agentId = 'test-agent-id';
        this.token = 'test-token';
        this.baseUrl = 'http://localhost:8080/api/public/agent';
        this.screenshot = {
            capture: async () => Buffer.alloc(10), // Dummy buffer
            validate: async (buf) => ({ valid: true, width: 1012, height: 800, image: { bitmap: { width: 1012, height: 800 } } })
        };
        this.vision = null; // Set after init
    }

    async callServerFunction(name, data) {
        console.log(`[MockAgent] Calling server function: ${name}`);
        // Simulate a successful AI response
        return {
            detected: true,
            confidence: 0.95,
            coordinates: { x: 500, y: 400 },
            objects: ['target_button'],
            source: 'AI_VISION'
        };
    }
}

const logger = {
    info: (msg, meta) => console.log(`INFO: ${msg}`, meta || ''),
    warn: (msg, meta) => console.log(`WARN: ${msg}`, meta || ''),
    error: (msg, meta) => console.log(`ERROR: ${msg}`, meta || '')
};

async function runTest() {
    console.log('--- Starting Phase 12 AI Vision Fallback Test ---');
    
    const VisionService = require('./agent/vision-service');
    const MissionEngine = require('./agent/mission-engine');
    
    const agent = new MockAgent();
    const vision = new VisionService(logger, agent);
    agent.vision = vision;
    const engine = new MissionEngine(logger, agent);

    // Test case: Deterministic fails (no assetUrl), AI succeeds
    console.log('\nTest 1: AI Fallback Trigger');
    const params = {
        aiFallback: true,
        aiPrompt: "Find the red button",
        aiThreshold: 0.7
    };

    try {
        const result = await engine.handleFindImage('test-emulator', params, 'test-run-id');
        console.log('Result:', JSON.stringify(result, null, 2));
        
        if (result.status === 'SUCCESS' && result.payload.source === 'AI_VISION') {
            console.log('✅ AI Fallback successfully triggered and returned result.');
        } else {
            console.log('❌ AI Fallback failed to return expected result.');
        }
    } catch (err) {
        console.error('Test failed with error:', err);
    }

    console.log('\n--- Test Complete ---');
}

runTest();
