// src/hooks/useAdminAgents.ts
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

export type ISO = string;

export type AgentInfo = {
    locationId: string;
    agentId?: string;
    status: "connected" | "disconnected";
    connectedAt?: ISO;
    lastSeen?: ISO;
    remoteAddress?: string;
    userAgent?: string;
    apiKey?: string;
    activity?: 'IDLE' | 'RECORDING';
    recordingId?: string;
    preview?: boolean;
    camera?: {
        url?: string;
        ip?: string;
        method?: 'tcp' | 'http' | 'rtsp';
        reachable?: boolean;
        lastCheck?: ISO;
        error?: string;
    };
    telemetry?: {
        cpu?: { usagePercent?: number | null };
        memory?: { total?: number; free?: number; used?: number; usedPercent?: number };
        disk?: { total?: number; free?: number; used?: number; usedPercent?: number };
        uptimeSec?: number;
        timestamp?: ISO;
    };
};

type SnapshotMsg     = { type: "snapshot"; agents: AgentInfo[]; time?: ISO };
type ConnectedMsg    = { type: "connected" | "agent_connected"; agent: AgentInfo; time?: ISO };
type DisconnectedMsg = { type: "disconnected" | "agent_disconnected"; locationId: string; time?: ISO };
type HeartbeatMsg    = { type: "heartbeat" | "agent_heartbeat"; locationId: string; lastSeen?: ISO; time?: ISO };
type UpsertMsg       = { type: "upsert"; agent: AgentInfo; time?: ISO };
type ServerMsg       = SnapshotMsg | ConnectedMsg | DisconnectedMsg | HeartbeatMsg | UpsertMsg | { type?: string; [k: string]: any };

type ConnStatus = "connecting" | "connected" | "reconnecting" | "closed";

type State = {
    status: ConnStatus;
    agents: Record<string, AgentInfo>; // keyed by locationId
    error?: string;
};

type Action =
    | { type: "STATUS"; status: ConnStatus; error?: string }
    | { type: "SNAPSHOT"; agents: AgentInfo[] }
    | { type: "UPSERT"; agent: AgentInfo }
    | { type: "DISCONNECTED"; locationId: string }
    | { type: "HEARTBEAT"; locationId: string; lastSeen?: ISO };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "STATUS":
            return { ...state, status: action.status, error: action.error };
        case "SNAPSHOT": {
            const agents: Record<string, AgentInfo> = {};
            for (const a of action.agents ?? []) agents[a.locationId] = a;
            return { ...state, agents };
        }
        case "UPSERT":
            return { ...state, agents: { ...state.agents, [action.agent.locationId]: action.agent } };
        case "DISCONNECTED": {
            const cur = state.agents[action.locationId];
            if (!cur) return state;
            return { ...state, agents: { ...state.agents, [action.locationId]: { ...cur, status: "disconnected" } } };
        }
        case "HEARTBEAT": {
            const cur = state.agents[action.locationId];
            if (!cur) return state;
            return { ...state, agents: { ...state.agents, [action.locationId]: { ...cur, lastSeen: action.lastSeen ?? cur.lastSeen } } };
        }
        default:
            return state;
    }
}

export function useAdminAgents(opts?: { token?: string; path?: string; autoStart?: boolean }) {
    const { token, path = "/admin", autoStart = true } = opts ?? {};
    const [state, dispatch] = useReducer(reducer, { status: "connecting", agents: {} });
    const wsRef = useRef<WebSocket | null>(null);
    const [wsInstance, setWsInstance] = useState<WebSocket | null>(null); // <- expose actual socket
    const backoffRef = useRef(1000);
    const retryTimer = useRef<number | null>(null);
    const manuallyClosed = useRef(false);

    const buildUrl = () => {
        const base = import.meta.env.VITE_API_URL || "http://localhost:3000"; // e.g. http://localhost:3000
        const u = new URL(base);
        const wsScheme = u.protocol === "https:" ? "wss:" : "ws:";
        const qs = token ? `?token=${encodeURIComponent(token)}` : "";
        return `${wsScheme}//${u.host}${path}${qs}`; // -> ws://localhost:3000/admin
    };

    const connect = () => {
        const curr = wsRef.current;
        if (curr && (curr.readyState === WebSocket.OPEN || curr.readyState === WebSocket.CONNECTING)) return;

        manuallyClosed.current = false;
        dispatch({ type: "STATUS", status: backoffRef.current > 1000 ? "reconnecting" : "connecting" });

        const url = buildUrl();
        const ws = new WebSocket(url);
        ws.binaryType = "arraybuffer"; // so MJPEG frames arrive as ArrayBuffer
        wsRef.current = ws;
        setWsInstance(ws);

        ws.onopen = () => {
            dispatch({ type: "STATUS", status: "connected" });
            backoffRef.current = 1000;
        };

        ws.onmessage = (ev) => {
            // Binary (MJPEG) frames are handled by CameraPreview; ignore them here
            if (typeof ev.data !== "string") return;

            let msg: ServerMsg;
            try { msg = JSON.parse(ev.data); } catch { return; }

            switch (msg.type) {
                case "snapshot":
                    dispatch({ type: "SNAPSHOT", agents: (msg as SnapshotMsg).agents ?? [] });
                    break;
                case "upsert":
                case "connected":
                case "agent_connected":
                    dispatch({ type: "UPSERT", agent: (msg as ConnectedMsg | UpsertMsg).agent });
                    break;
                case "disconnected":
                case "agent_disconnected":
                    dispatch({ type: "DISCONNECTED", locationId: (msg as DisconnectedMsg).locationId });
                    break;
                case "heartbeat":
                case "agent_heartbeat":
                    dispatch({ type: "HEARTBEAT", locationId: (msg as HeartbeatMsg).locationId, lastSeen: (msg as HeartbeatMsg).lastSeen });
                    break;
                default:
                    // ignore unknown
                    break;
            }
        };

        ws.onerror = () => { /* handled in onclose */ };

        ws.onclose = () => {
            wsRef.current = null;
            setWsInstance(null);
            if (manuallyClosed.current) {
                dispatch({ type: "STATUS", status: "closed" });
                return;
            }
            dispatch({ type: "STATUS", status: "reconnecting" });
            const delay = Math.min(backoffRef.current, 30_000);
            if (retryTimer.current) window.clearTimeout(retryTimer.current);
            retryTimer.current = window.setTimeout(connect, delay);
            backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
        };
    };

    const disconnect = () => {
        manuallyClosed.current = true;
        if (retryTimer.current) { window.clearTimeout(retryTimer.current); retryTimer.current = null; }
        wsRef.current?.close();
        wsRef.current = null;
        setWsInstance(null);
        dispatch({ type: "STATUS", status: "closed" });
    };

    useEffect(() => {
        if (!autoStart) return;
        connect();
        return disconnect; // cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, token]);

    const agentsByLocation = state.agents;
    const agents = useMemo(() => Object.values(state.agents), [state.agents]);

    return {
        status: state.status,
        error: state.error,
        agentsByLocation,
        agents,
        connect,
        disconnect,
        adminWs: wsInstance, // <-- pass this to <CameraPreview />
        getAgent: (locationId: string) => agentsByLocation[locationId],
    };
}
