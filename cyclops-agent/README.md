Cyclops Agent

Telemetry
- Heartbeat messages now include a `telemetry` object alongside legacy `metrics`.
- Model: see `src/model/TelemetryData.ts`.
- Collected every 15s in `src/app.ts` via `TelemetryService`.

Example heartbeat payload (abridged)
```
{
  "type": "heartbeat",
  "ts": "2025-01-01T12:00:00.000Z",
  "metrics": { "uptimeSec": 123, "freeMem": 123, "totalMem": 456, ... },
  "telemetry": {
    "timestamp": "2025-01-01T12:00:00.000Z",
    "uptimeSec": 123,
    "os": { "platform": "win32", "release": "10.0.19045", ... },
    "cpu": { "model": "Intel...", "cores": 8, "usagePercent": 12.3, ... },
    "memory": { "total": 17179869184, "free": 4294967296, "used": 12884901888, "usedPercent": 75.0 },
    "network": { "interfaces": [{ "name": "Ethernet", "ipv4": ["192.168.0.2"] }] },
    "process": { "pid": 1234, "rss": 12345678, "cpuUsagePercent": 3.2 },
    "agent": { "recording": false, "preview": true }
  }
}
```

