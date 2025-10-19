import {WebSocket} from "ws";

class AgentsConnectionService {

    agents = new Map<string, any>();

    upsertAgent(agentId: string, patch: any) {
        const prev = this.agents.get(agentId) || { agentId, status: 'disconnected' };
        const next = { ...prev, ...patch };
        this.agents.set(agentId, next);
        return next;
    }

    removeSocketFromAgents(ws: WebSocket) {
        for (const [agentId, info] of this.agents) {
            if (info.ws === ws) {
                const updated = { ...info };
                delete updated.ws;
                updated.status = 'disconnected';
                updated.lastSeen = new Date().getTime();
                this.agents.set(agentId, updated);
            }
        }
    }

}

export default new AgentsConnectionService();
