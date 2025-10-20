"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const UsbCameraController_1 = require("./camera/UsbCameraController");
const TelemetryService_1 = require("./telemetry/TelemetryService");
const WebSocketClient_1 = require("./ws/WebSocketClient");
const WebSocketCommandHandler_1 = require("./handlers/WebSocketCommandHandler");
const SERVER_URL = 'ws://localhost:3000/agents';
const API_KEY = 'SECRET_API_KEY';
const AGENT_ID = 'HP_EliteDesk';
const LOCATION_ID = '6895eef8ab6ecd1201d71372';
const GCS_BUCKET = 'cyclops-videos';
// List video devices at startup for observability
UsbCameraController_1.UsbCameraController.listVideoDevices().then(devices => {
    console.log('Video devices:', devices);
});
const telemetry = new TelemetryService_1.TelemetryService();
// Build the handler which manages preview/recording and uses the WebSocketClient to respond
let client;
const handler = new WebSocketCommandHandler_1.WebSocketCommandHandler({
    sendJson: (j) => client === null || client === void 0 ? void 0 : client.sendJson(j),
    sendBinary: (b) => client === null || client === void 0 ? void 0 : client.sendBinary(b),
    agentId: AGENT_ID,
    locationId: LOCATION_ID,
    gcsBucket: GCS_BUCKET,
});
client = new WebSocketClient_1.WebSocketClient({
    url: SERVER_URL,
    headers: {
        'User-Agent': 'node-agent/1.0',
        'x-location-id': LOCATION_ID,
        'x-api-key': API_KEY,
    },
    heartbeatIntervalMs: 15000,
    buildHeartbeat: () => {
        const telemetryPayload = telemetry.collect(handler.getAgentState());
        return {
            type: 'heartbeat',
            ts: telemetryPayload.timestamp,
            metrics: {
                uptimeSec: telemetryPayload.uptimeSec,
                loadAvg: telemetryPayload.cpu.loadAvg,
                freeMem: telemetryPayload.memory.free,
                totalMem: telemetryPayload.memory.total,
                recording: telemetryPayload.agent.recording,
                recordingId: telemetryPayload.agent.recordingId,
                preview: telemetryPayload.agent.preview,
            },
            telemetry: telemetryPayload,
        };
    },
    onOpen: () => {
        console.log('[agent] connected');
        client.sendJson({ type: 'hello', agentId: AGENT_ID, version: '1.0.0' });
    },
    onMessage: (msg) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('MSG RECEIVED:', msg);
        yield handler.handle(msg);
    }),
    onClose: (code, reason) => {
        console.log(`[agent] connection closed (${code}) ${reason}`);
    },
    onError: (err) => {
        console.error('[agent] socket error:', err.message);
    },
});
client.connect();
