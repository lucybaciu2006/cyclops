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

        // optionally upsert camera info from telemetry
        const cam = (msg as any)?.telemetry?.camera;
        if (cam) {
          agentsPool.upsert(locationId, {
            camera: {
              url: cam.url,
              ip: cam.ip,
              method: cam.method,
              reachable: cam.reachable,
              lastCheck: cam.lastCheck,
              error: cam.error,
            } as any,
          } as any);
        }
        return;
      }

            // handle other commands if you add any
        });

        const cleanup = (reason?: string) => agentsPool.markDisconnected(locationId, reason);
        ws.on("close", () => cleanup("close"));
        ws.on("error", () => cleanup("error"));
    }
}
