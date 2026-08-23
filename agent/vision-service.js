const Jimp = require('jimp-compact');

class VisionService {
    constructor(logger, agent) {
        this.logger = logger;
        this.agent = agent;
    }

    async analyzeWithAi(screenshotBase64, prompt, missionRunId, deviceId) {
        this.logger.info('Requesting AI Vision fallback', { prompt });
        try {
            const response = await this.agent.callServerFunction('processAiVision', {
                agentId: this.agent.agentId,
                token: this.agent.token,
                deviceId: deviceId,
                missionRunId: missionRunId,
                screenshot: screenshotBase64,
                prompt: prompt
            });

            if (response.error) {
                this.logger.error('AI Vision returned error', { error: response.error });
                return { detected: false, confidence: 0, error: response.error };
            }

            return response;
        } catch (error) {
            this.logger.error('AI Vision request failed', { error: error.message });
            return { detected: false, confidence: 0, error: error.message };
        }
    }


    /**
     * Deterministic template matching
     * Finds occurrences of 'template' in 'screenshot'
     */
    async findTemplate(screenshot, templateImage, threshold = 0.8) {
        const start = Date.now();
        const matches = [];

        try {
            const screen = screenshot.bitmap;
            const template = templateImage.bitmap;

            if (template.width > screen.width || template.height > screen.height) {
                throw new Error('Template is larger than screenshot');
            }

            // Simple pixel-matching scan (optimized for Jimp)
            // In a real high-perf scenario, we'd use OpenCV, but Jimp is pure JS and works for Phase 09.
            // We'll scan with a step to improve speed if needed, but for 1012x800 it should be okay.
            
            for (let y = 0; y <= screen.height - template.height; y += 2) {
                for (let x = 0; x <= screen.width - template.width; x += 2) {
                    let diff = 0;
                    let totalPixels = 0;
                    
                    // Sample corners and center first for quick rejection
                    if (!this.quickCheck(screen, template, x, y, threshold)) continue;

                    // Full check
                    for (let ty = 0; ty < template.height; ty += 2) {
                        for (let tx = 0; tx < template.width; tx += 2) {
                            const sIdx = ((y + ty) * screen.width + (x + tx)) << 2;
                            const tIdx = (ty * template.width + tx) << 2;

                            // Skip transparent pixels in template
                            if (template.data[tIdx + 3] < 128) continue;

                            diff += Math.abs(screen.data[sIdx] - template.data[tIdx]);
                            diff += Math.abs(screen.data[sIdx + 1] - template.data[tIdx + 1]);
                            diff += Math.abs(screen.data[sIdx + 2] - template.data[tIdx + 2]);
                            totalPixels++;
                        }
                    }

                    const score = 1 - (diff / (totalPixels * 255 * 3));
                    if (score >= threshold) {
                        matches.push({
                            confidence: score,
                            x,
                            y,
                            width: template.width,
                            height: template.height,
                            center_x: x + Math.floor(template.width / 2),
                            center_y: y + Math.floor(template.height / 2)
                        });
                        
                        // Skip ahead to avoid overlapping matches of the same object
                        x += Math.floor(template.width / 2);
                    }
                }
            }

            matches.sort((a, b) => b.confidence - a.confidence);

            return {
                detected: matches.length > 0,
                confidence: matches.length > 0 ? matches[0].confidence : 0,
                matches: matches.slice(0, 10), // Limit to top 10
                processingTimeMs: Date.now() - start
            };

        } catch (error) {
            this.logger.error('Vision processing failed', { error: error.message });
            throw error;
        }
    }

    quickCheck(screen, template, x, y, threshold) {
        // Check 4 corners and center
        const points = [
            [0, 0], 
            [template.width - 1, 0], 
            [0, template.height - 1], 
            [template.width - 1, template.height - 1],
            [Math.floor(template.width / 2), Math.floor(template.height / 2)]
        ];

        let diff = 0;
        for (const [px, py] of points) {
            const sIdx = ((y + py) * screen.width + (x + px)) << 2;
            const tIdx = (py * template.width + px) << 2;
            
            diff += Math.abs(screen.data[sIdx] - template.data[tIdx]);
            diff += Math.abs(screen.data[sIdx + 1] - template.data[tIdx + 1]);
            diff += Math.abs(screen.data[sIdx + 2] - template.data[tIdx + 2]);
        }
        
        const score = 1 - (diff / (points.length * 255 * 3));
        return score >= threshold * 0.7; // Loose threshold for quick rejection
    }
}

module.exports = VisionService;