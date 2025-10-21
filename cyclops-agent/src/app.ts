import { TelemetryService } from "./telemetry/TelemetryService";
import { CameraHealthService } from "./camera/CameraHealthService";
import { WebSocketClient } from "./ws/WebSocketClient";
import { WebSocketCommandHandler } from "./handlers/WebSocketCommandHandler";
import {env} from "./env";

const SERVER_URL = env.SERVER_WS_ADDRESS;

// Camera health checker using env vars
const CAM_INPUT_URL = env.CAM_INPUT_URL;
const CAMERA_IP = env.CAMERA_IP;
const camHealth = new CameraHealthService({ url: CAM_INPUT_URL, ip: CAMERA_IP, intervalMs: 10000 });
camHealth.start();
console.log(camHealth);
const telemetry = new TelemetryService();
telemetry.play();

console.log(telemetry);
telemetry.setCameraProvider(() => camHealth.snapshot());

// Build the handler which manages preview/recording and uses the WebSocketClient to respond
let client: WebSocketClient;

const commandHandler = new WebSocketCommandHandler({
  sendJson: (j) => client?.sendJson(j),
  sendBinary: (b) => client?.sendBinary(b),
  agentId: env.DEVICE_ID,
  locationId: env.LOCATION_ID,
  gcsBucket: env.GOOGLE_CLOUD_BUCKET,
});

client = new WebSocketClient({
  url: SERVER_URL,
  headers: {
    'User-Agent': 'node-agent/1.0',
    'x-location-id': env.LOCATION_ID,
    'x-api-key': env.API_KEY,
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
    client.sendJson({ type: 'hello', agentId: env.DEVICE_ID, version: '1.0.0' });
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
