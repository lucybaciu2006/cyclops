// core/ws/AdminHub.ts
import { WebSocketServer } from "ws";
import { agentsPool } from "./AgentsPool";
import { Subscription } from "rxjs";

export class AdminHub {
    constructor(private wssAdmin: WebSocketServer) {}

    init() {
        this.wssAdmin.on("connection", (ws) => {
            console.log('Admin app connected');
            // send snapshot first
            ws.send(JSON.stringify({ type: "snapshot", agents: agentsPool.list() }));

            // live updates
            const subs: Subscription[] = [];

            subs.push(
                agentsPool.events$.subscribe((evt) => {
                    try { ws.send(JSON.stringify(evt)); } catch {}
                })
            );

            ws.on("close", () => subs.forEach(s => s.unsubscribe()));
            ws.on("error", () => subs.forEach(s => s.unsubscribe()));
        });
    }
}