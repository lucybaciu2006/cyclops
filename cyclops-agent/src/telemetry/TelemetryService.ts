import os from 'os';
import { TelemetryData, AgentStateTelemetry } from "../model/TelemetryData";
import { CameraHealth } from "../camera/CameraHealthService";

/**
 * TelemetryService collects system and process metrics for the agent.
 * It keeps minimal internal state to compute CPU usage deltas between calls.
 */
export class TelemetryService {
  private prevCpuInfo: os.CpuInfo[] | null = null;
  private prevProcCpu: NodeJS.CpuUsage | null = null;
  private prevHrtimeNs: bigint | null = null;
  private _cameraProvider?: () => CameraHealth | undefined;

  constructor() {
    console.log('constructor called');
  }

  collect(agent: AgentStateTelemetry): TelemetryData {
    const now = new Date();
    const uptimeSec = Math.floor(process.uptime());

    // OS info
    const platform = process.platform;
    const release = os.release();
    const arch = process.arch;
    const hostname = os.hostname();

    // CPU static
    const cpus = os.cpus();
    const cores = cpus?.length ?? 0;
    const model = cores > 0 ? cpus[0].model : "unknown";
    const speedMhz = cores > 0 ? cpus[0].speed : 0;
    const loadAvg = os.loadavg(); // zeroes on Windows

    // CPU usage percent (over interval since last collect)
    let usagePercent: number | null = null;
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
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedPercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

    // Process metrics
    const mem = process.memoryUsage();
    const procCpu = process.cpuUsage();
    const hrNow = process.hrtime.bigint();
    let procCpuPercent: number | null = null;
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
    const netIfaces = os.networkInterfaces();
    const interfaces = Object.entries(netIfaces).map(([name, infos]) => ({
      name,
      ipv4: (infos || []).filter(i => i.family === 'IPv4').map(i => i.address),
      ipv6: (infos || []).filter(i => i.family === 'IPv6').map(i => i.address),
    }));

    // Disk: leave undefined by default; can be enhanced per-platform later
    const disk = undefined;

    const telemetry: TelemetryData = {
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

    // Attach last-known camera health if available
    const cam = this._cameraProvider?.();
    if (cam) {
      telemetry.camera = {
        url: cam.url,
        ip: cam.ip,
        method: cam.method,
        reachable: cam.reachable,
        lastCheck: cam.lastCheck,
        error: cam.error,
      };
    }

    return telemetry;
  }

  setCameraProvider(fn: () => CameraHealth | undefined) {
    this._cameraProvider = fn;
  }

  play() {
    console.log('it works');
  }
}
