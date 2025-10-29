// core/ws/AgentGateway.ts
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { agentsPool, type HBWS } from "./AgentsPool";

const PING_INTERVAL_MS = 30_000;

export class AgentGateway {
    private hb?: NodeJS.Timeout;

    constructor(private wss: WebSocketServer) {}

    /** Call once after creating the WebSocketServer */
    init() {
        if (this.hb) return;

        // liveness pings
        this.hb = setInterval(() => {
            this.wss.clients.forEach((c) => {
                const ws = c as HBWS;
                if (ws.isAlive === false) return ws.terminate();
                ws.isAlive = false;
                try { ws.ping(); } catch {}
            });
        }, PING_INTERVAL_MS);

        this.wss.on("close", () => this.hb && clearInterval(this.hb));
        this.wss.on("connection", (ws, req) => this.onConnection(ws as HBWS, req));
    }

    private onConnection(ws: HBWS, req: IncomingMessage & { auth?: any }) {
        ws.isAlive = true;
        ws.on("pong", () => { ws.isAlive = true; });

        const locationId: string | undefined = req.auth?.locationId;
        const apiKey: string | undefined = req.auth?.apiKey;
        const remoteAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString();
        const userAgent = (req.headers["user-agent"] || "").toString();

        if (!locationId) {
            try { ws.close(1008, "Missing locationId"); } catch {}
            return;
        }

        // attach & optionally close any previous socket
        const prev = agentsPool.attach(locationId, ws, { apiKey, remoteAddress, userAgent });
        if (prev && prev !== ws && prev.readyState === WebSocket.OPEN) {
            try { prev.close(1008, "Replaced by new connection"); } catch {}
        }

        ws.on("message", (buf) => {
            let msg: any;
            try { msg = JSON.parse(buf.toString()); } catch { return; }

            if (msg?.type === "hello") {
                agentsPool.upsert(locationId, {
                    agentId: msg.agentId,
                    // connectedAt is preserved by pool
                });
                return;
            }

      if (msg?.type === "heartbeat") {
        // update lastSeen
        agentsPool.heartbeat(locationId);

        const telemetry = (msg as any)?.telemetry;
        const cam = telemetry?.camera;
        const mem = telemetry?.memory;
        const cpu = telemetry?.cpu;
        const disk = telemetry?.disk;
        const ts = telemetry?.timestamp ?? (msg as any)?.ts;
        const uptimeSec = telemetry?.uptimeSec ?? (msg as any)?.metrics?.uptimeSec;

        const patch: any = {};
        if (cam) {
          patch.camera = {
            url: cam.url,
            ip: cam.ip,
            method: cam.method,
            reachable: cam.reachable,
            lastCheck: cam.lastCheck,
            error: cam.error,
          };
        }
        patch.telemetry = {
          cpu: { usagePercent: cpu?.usagePercent },
          memory: mem ? { total: mem.total, free: mem.free, used: mem.used, usedPercent: mem.usedPercent } : undefined,
          disk: disk ? { total: disk.total, free: disk.free, used: disk.used, usedPercent: disk.usedPercent } : undefined,
          uptimeSec,
          timestamp: ts,
        };

        const metrics = (msg as any)?.metrics || {};
        const isRec = !!metrics.recording;
        patch.activity = isRec ? 'RECORDING' : 'IDLE';
        if (metrics.recordingId) patch.recordingId = metrics.recordingId;
        if (typeof metrics.preview === 'boolean') patch.preview = metrics.preview;

        agentsPool.upsert(locationId, patch);
        return;
      }

      // Recording lifecycle events from agent
      if (msg?.type === 'recording-done' && msg.recordingId) {
        // Optional: update RecordingJob status to COMPLETED
        import('../../models/entities/recording/RecordingJob').then(({ RecordingJob, RecordingJobStatus }) => {
          RecordingJob.findOneAndUpdate({ recordingId: msg.recordingId }, { status: RecordingJobStatus.COMPLETED }).exec().catch(() => {});
        }).catch(() => {});
        return;
      }
      if (msg?.type === 'recording-error' && msg.recordingId) {
        import('../../models/entities/recording/RecordingJob').then(({ RecordingJob, RecordingJobStatus }) => {
          RecordingJob.findOneAndUpdate({ recordingId: msg.recordingId }, { status: RecordingJobStatus.FAILED }).exec().catch(() => {});
        }).catch(() => {});
        return;
      }

            // handle other commands if you add any
        });

        const cleanup = (reason?: string) => agentsPool.markDisconnected(locationId, reason);
        ws.on("close", () => cleanup("close"));
        ws.on("error", () => cleanup("error"));
    }
}
