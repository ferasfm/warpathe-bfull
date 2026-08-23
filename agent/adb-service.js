const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AdbService {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.adbPath = config.adbPath || 'adb';
        this.allowedCommands = [
            'devices',
            'get-state',
            'shell wm size',
            'shell wm density',
            'shell getprop ro.product.model',
            'shell getprop ro.build.version.release'
        ];
    }

    async isAvailable() {
        try {
            await execPromise(`${this.adbPath} version`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async execute(command, serial = null) {
        // Simple allowlist check
        const isAllowed = this.allowedCommands.some(allowed => command.startsWith(allowed));
        if (!isAllowed) {
            throw new Error(`Command not allowed: ${command}`);
        }

        const fullCommand = serial ? `"${this.adbPath}" -s ${serial} ${command}` : `"${this.adbPath}" ${command}`;
        
        try {
            this.logger.debug(`Executing ADB command: ${fullCommand}`);
            const { stdout, stderr } = await execPromise(fullCommand, { timeout: 10000 });
            return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
        } catch (error) {
            this.logger.error(`ADB command failed: ${fullCommand}`, { error: error.message });
            return { stdout: error.stdout?.trim(), stderr: error.stderr?.trim(), success: false, error: error.message };
        }
    }

    async getDevices() {
        const result = await this.execute('devices');
        if (!result.success) return [];

        const lines = result.stdout.split('\n');
        const devices = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const serial = parts[0];
                const state = parts[1];
                devices.push({ serial, state });
            }
        }
        return devices;
    }

    async getDeviceInfo(serial) {
        const [model, version, size, density] = await Promise.all([
            this.execute('shell getprop ro.product.model', serial),
            this.execute('shell getprop ro.build.version.release', serial),
            this.execute('shell wm size', serial),
            this.execute('shell wm density', serial)
        ]);

        return {
            serial,
            model: model.stdout || 'Unknown',
            androidVersion: version.stdout || 'Unknown',
            resolution: size.stdout ? size.stdout.replace('Physical size: ', '') : 'Unknown',
            dpi: density.stdout ? parseInt(density.stdout.replace('Physical density: ', '')) : null
        };
    }
}

module.exports = AdbService;
