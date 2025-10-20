export interface CpuTelemetry {
  model: string;
  cores: number;
  speedMhz: number;
  loadAvg?: number[] | null;
  usagePercent?: number | null;
}

export interface MemoryTelemetry {
  total: number;
  free: number;
  used: number;
  usedPercent: number;
}

export interface DiskTelemetry {
  total?: number;
  free?: number;
  used?: number;
  usedPercent?: number;
  note?: string;
}

export interface NetworkInterfaceTelemetry {
  name: string;
  ipv4?: string[];
  ipv6?: string[];
}

export interface ProcessTelemetry {
  pid: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  cpuUserMicros?: number;
  cpuSystemMicros?: number;
  cpuUsagePercent?: number | null;
}

export interface AgentStateTelemetry {
  recording: boolean;
  recordingId?: string | null;
  preview: boolean;
}

export interface TelemetryData {
  timestamp: string;
  uptimeSec: number;
  os: {
    platform: NodeJS.Platform;
    release: string;
    arch: string;
    hostname: string;
  };
  cpu: CpuTelemetry;
  memory: MemoryTelemetry;
  disk?: DiskTelemetry;
  network?: {
    interfaces: NetworkInterfaceTelemetry[];
  };
  process: ProcessTelemetry;
  agent: AgentStateTelemetry;
}

