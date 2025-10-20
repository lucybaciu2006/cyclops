"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const os_1 = __importDefault(require("os"));
/**
 * TelemetryService collects system and process metrics for the agent.
 * It keeps minimal internal state to compute CPU usage deltas between calls.
 */
class TelemetryService {
    constructor() {
        this.prevCpuInfo = null;
        this.prevProcCpu = null;
        this.prevHrtimeNs = null;
    }
    collect(agent) {
        var _a;
        const now = new Date();
        const uptimeSec = Math.floor(process.uptime());
        // OS info
        const platform = process.platform;
        const release = os_1.default.release();
        const arch = process.arch;
        const hostname = os_1.default.hostname();
        // CPU static
        const cpus = os_1.default.cpus();
        const cores = (_a = cpus === null || cpus === void 0 ? void 0 : cpus.length) !== null && _a !== void 0 ? _a : 0;
        const model = cores > 0 ? cpus[0].model : "unknown";
        const speedMhz = cores > 0 ? cpus[0].speed : 0;
        const loadAvg = os_1.default.loadavg(); // zeroes on Windows
        // CPU usage percent (over interval since last collect)
        let usagePercent = null;
        if (this.prevCpuInfo) {
            const prev = this.prevCpuInfo;
            let idleDiff = 0;
            let totalDiff = 0;
            for (let i = 0; i < cpus.length; i++) {
                const p = prev[i].times;
                const c = cpus[i].times;
                const idle = c.idle - p.idle;
                const total = (c.user - p.user) + (c.nice - p.nice) + (c.sys - p.sys) + (c.irq - p.irq) + idle;
                idleDiff += idle;
                totalDiff += total;
            }
            if (totalDiff > 0) {
                const cpu = (1 - idleDiff / totalDiff) * 100;
                usagePercent = Math.max(0, Math.min(100, cpu));
            }
        }
        this.prevCpuInfo = cpus;
        // Memory
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const usedPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;
        // Process metrics
        const mem = process.memoryUsage();
        const procCpu = process.cpuUsage();
        const hrNow = process.hrtime.bigint();
        let procCpuPercent = null;
        if (this.prevProcCpu && this.prevHrtimeNs) {
            const userDiffMicros = procCpu.user - this.prevProcCpu.user;
            const sysDiffMicros = procCpu.system - this.prevProcCpu.system;
            const elapsedNs = Number(hrNow - this.prevHrtimeNs);
            const elapsedMicros = elapsedNs / 1000;
            if (elapsedMicros > 0 && cores > 0) {
                const totalCpuMicros = userDiffMicros + sysDiffMicros;
                // Normalize by elapsed time and number of cores to get percent
                procCpuPercent = Math.max(0, Math.min(100, (totalCpuMicros / elapsedMicros) * 100 / cores));
            }
        }
        this.prevProcCpu = procCpu;
        this.prevHrtimeNs = hrNow;
        // Network interfaces (basic addressing)
        const netIfaces = os_1.default.networkInterfaces();
        const interfaces = Object.entries(netIfaces).map(([name, infos]) => ({
            name,
            ipv4: (infos || []).filter(i => i.family === 'IPv4').map(i => i.address),
            ipv6: (infos || []).filter(i => i.family === 'IPv6').map(i => i.address),
        }));
        // Disk: leave undefined by default; can be enhanced per-platform later
        const disk = undefined;
        const telemetry = {
            timestamp: now.toISOString(),
            uptimeSec,
            os: { platform, release, arch, hostname },
            cpu: { model, cores, speedMhz, loadAvg, usagePercent },
            memory: { total: totalMem, free: freeMem, used: usedMem, usedPercent },
            disk,
            network: { interfaces },
            process: {
                pid: process.pid,
                rss: mem.rss,
                heapUsed: mem.heapUsed,
                heapTotal: mem.heapTotal,
                external: mem.external || 0,
                cpuUserMicros: procCpu.user,
                cpuSystemMicros: procCpu.system,
                cpuUsagePercent: procCpuPercent,
            },
            agent,
        };
        return telemetry;
    }
}
exports.TelemetryService = TelemetryService;
