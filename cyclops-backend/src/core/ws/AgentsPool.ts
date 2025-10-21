// core/ws/AgentsPool.ts
import { BehaviorSubject, Subject } from "rxjs";
import type { WebSocket } from "ws";

type ISO = string;
export type AgentStatus = "connected" | "disconnected";
export type HBWS = WebSocket & { isAlive?: boolean };

export interface AgentInfo {
    /** logical location key */
    locationId: string;
    /** device-provided id (from hello) */
    agentId?: string;
    status: AgentStatus;
    connectedAt?: ISO;
    lastSeen?: ISO;
    remoteAddress?: string;
    userAgent?: string;
    apiKey?: string;
    camera?: {
        url?: string;
        ip?: string;
        method?: 'tcp' | 'http' | 'rtsp';
        reachable?: boolean;
        lastCheck?: ISO;
        error?: string;
    };

    // Latest telemetry snapshot (subset used by admin UI)
    telemetry?: {
        cpu?: { usagePercent?: number | null };
        memory?: { total?: number; free?: number; used?: number; usedPercent?: number };
        disk?: { total?: number; free?: number; used?: number; usedPercent?: number };
        uptimeSec?: number;
        timestamp?: ISO;
    };

    /** live socket; present only if connected */
    ws?: HBWS;
}

export type AgentEvent =
    | { type: "connected"; agent: AgentInfo }
    | { type: "disconnected"; locationId: string; at: ISO; reason?: string }
    | { type: "heartbeat"; locationId: string; at: ISO }
    | { type: "upsert"; agent: AgentInfo }
    | { type: "replaced"; locationId: string }; // old socket replaced by new

const nowISO = () => new Date().toISOString();

/**
 * Pure state & signals. Thread-safe in Node's single-threaded model.
 * You can import this anywhere (controllers, jobs) to query state.
 */
export class AgentsPool {
    private byLocation = new Map<string, AgentInfo>();

    /** latest full snapshot */
    readonly snapshot$ = new BehaviorSubject<AgentInfo[]>([]);
    /** granular events stream */
    readonly events$ = new Subject<AgentEvent>();

    constructor() {
        // setInterval(() => {
            // console.log('==== Active agents: ', Array.from(this.byLocation.values()).filter(x => x.status === 'connected').length);
        // }, 5000);
    }

    // ---------- Queries

    get(locationId: string): AgentInfo | undefined {
        return this.byLocation.get(locationId);
    }

    isConnected(locationId: string): boolean {
        return this.byLocation.get(locationId)?.status === "connected";
    }

    list(): AgentInfo[] {
        return this.snapshot$.value;
    }

    // ---------- Mutations (called by your gateway)

    /**
     * Attach/replace the active socket for a location.
     * Returns the previously attached socket (if any) so the caller can close it.
     */
    attach(locationId: string, ws: HBWS, meta: Partial<AgentInfo>): HBWS | undefined {
        const prev = this.byLocation.get(locationId)?.ws;

        const existing = this.byLocation.get(locationId) || { locationId, status: "disconnected" } as AgentInfo;
        const now = nowISO();
        const next: AgentInfo = {
            ...existing,
            ...meta,
            locationId,
            ws,
            status: "connected",
            connectedAt: existing.connectedAt ?? now,
            lastSeen: now,
        };

        this.byLocation.set(locationId, next);
        this.pushSnapshot(next);
        this.events$.next({ type: prev && prev !== ws ? "replaced" : "connected", locationId, ...(prev && prev !== ws ? {} : { agent: next }) } as AgentEvent);
        if (!prev || prev === ws) this.events$.next({ type: "upsert", agent: next });
        return prev;
    }

    /** Update agentId/lastSeen or other fields. */
    upsert(locationId: string, patch: Partial<AgentInfo>) {
        const prev = this.byLocation.get(locationId) || { locationId, status: "disconnected" } as AgentInfo;
        const next: AgentInfo = { ...prev, ...patch };
        this.byLocation.set(locationId, next);
        this.pushSnapshot(next);
        this.events$.next({ type: "upsert", agent: next });
    }

    /** Mark heartbeat (no-op if unknown). */
    heartbeat(locationId: string) {
        const info = this.byLocation.get(locationId);
        if (!info) return;
        info.lastSeen = nowISO();
        this.byLocation.set(locationId, info);
        this.pushSnapshot(info);
        this.events$.next({ type: "heartbeat", locationId, at: info.lastSeen });
    }

    /** Mark disconnected; keep record for UI/history (ws cleared). */
    markDisconnected(locationId: string, reason?: string) {
        const prev = this.byLocation.get(locationId);
        if (!prev) return;
        const copy: AgentInfo = { ...prev };
        delete (copy as any).ws;
        copy.status = "disconnected";
        copy.lastSeen = nowISO();
        this.byLocation.set(locationId, copy);
        this.pushSnapshot(copy);
        this.events$.next({ type: "disconnected", locationId, at: copy.lastSeen!, reason });
        this.events$.next({ type: "upsert", agent: copy });
    }

    // ---------- internals

    private pushSnapshot(_changed: AgentInfo) {
        const list = Array.from(this.byLocation.values())
            .sort((a, b) => a.locationId.localeCompare(b.locationId));
        this.snapshot$.next(list);
    }
}

// Export a singleton by default (easy global access)
export const agentsPool = new AgentsPool();
