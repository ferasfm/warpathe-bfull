const fs = require('fs-extra');
const Jimp = require('jimp-compact');

class ScreenshotService {
    constructor(logger, adbService) {
        this.logger = logger;
        this.adb = adbService;
        this.expectedWidth = 1012;
        this.expectedHeight = 800;
    }

    async capture(serial) {
        this.logger.info('Capturing screenshot', { serial });
        
        try {
            // Using exec-out screencap -p for raw PNG stream
            const result = await this.adb.execute('exec-out screencap -p', serial);
            if (!result.success) {
                throw new Error(`ADB screenshot failed: ${result.error}`);
            }

            // The stdout is binary for exec-out
            // Note: In Node, child_process.exec might mangle binary if not handled.
            // But adb-service uses execPromise which uses default encoding (utf8).
            // We need to fix adb-service to handle binary for this specific command.
            return result.stdout;
        } catch (error) {
            this.logger.error('Screenshot capture failed', { error: error.message });
            throw error;
        }
    }

    async validate(imageBuffer) {
        try {
            const image = await Jimp.read(imageBuffer);
            const width = image.bitmap.width;
            const height = image.bitmap.height;

            if (width !== this.expectedWidth || height !== this.expectedHeight) {
                return {
                    valid: false,
                    error: 'RESOLUTION_MISMATCH',
                    actual: { width, height },
                    expected: { width: this.expectedWidth, height: this.expectedHeight }
                };
            }

            return {
                valid: true,
                width,
                height,
                image
            };
        } catch (error) {
            this.logger.error('Screenshot validation failed', { error: error.message });
            return { valid: false, error: 'INVALID_IMAGE' };
        }
    }
}

module.exports = ScreenshotService;