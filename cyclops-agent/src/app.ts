import { UsbCameraController } from "./camera/UsbCameraController";
import { TelemetryService } from "./telemetry/TelemetryService";
import { WebSocketClient } from "./ws/WebSocketClient";
import { WebSocketCommandHandler } from "./handlers/WebSocketCommandHandler";

const SERVER_URL = 'ws://localhost:3000/agents';
const API_KEY = 'SECRET_API_KEY';
const AGENT_ID = 'HP_EliteDesk';
const LOCATION_ID = '6895eef8ab6ecd1201d71372';
const GCS_BUCKET = 'cyclops-videos';

// List video devices at startup for observability
UsbCameraController.listVideoDevices().then(devices => {
  console.log('Video devices:', devices);
});

const telemetry = new TelemetryService();

// Build the handler which manages preview/recording and uses the WebSocketClient to respond
let client: WebSocketClient;

const commandHandler = new WebSocketCommandHandler({
  sendJson: (j) => client?.sendJson(j),
  sendBinary: (b) => client?.sendBinary(b),
  agentId: AGENT_ID,
  locationId: LOCATION_ID,
  gcsBucket: GCS_BUCKET,
});

client = new WebSocketClient({
  url: SERVER_URL,
  headers: {
    'User-Agent': 'node-agent/1.0',
    'x-location-id': LOCATION_ID,
    'x-api-key': API_KEY,
  },
  heartbeatIntervalMs: 15000,
  buildHeartbeat: () => {
    const telemetryPayload = telemetry.collect(commandHandler.getAgentState());
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
  onMessage: async (msg) => {
    console.log('MSG RECEIVED:', msg);
    await commandHandler.handle(msg);
  },
  onClose: (code, reason) => {
    console.log(`[agent] connection closed (${code}) ${reason}`);
  },
  onError: (err) => {
    console.error('[agent] socket error:', err.message);
  },
});

client.connect();
