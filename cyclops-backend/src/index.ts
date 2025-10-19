import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import "dotenv/config";
import http, { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import multer from "multer";

import { connectToMongoose } from "./config/mongoose";
import { env } from "./config/env";

import { requestLogger } from "./middleware/loggerMiddleware";
import { authenticateToken } from "./middleware/authMiddleware";
import { ErrorHandler } from "./middleware/errorHandler";

import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { AdminUsersController } from "./controllers/admin/AdminUsersController";
import { AdminTicketsController } from "./controllers/admin/AdminTicketsController";
import { AdminInvitationsController } from "./controllers/admin/AdminInvitationsController";
import { AdminSportLocationController } from "./controllers/admin/AdminSportLocationController";
import { SportLocationController } from "./controllers/SportLocationController";
import { StripeWebhooksController } from "./controllers/StripeWebhooksController";
import { PaymentController } from "./controllers/PaymentController";
import { SupportController } from "./controllers/SupportController";

import { ISportLocation, SportLocation } from "./models/entities/SportLocation";

// NEW imports (state + ws wiring)
import { agentsPool } from "./core/ws/AgentsPool";
import { AgentGateway } from "./core/ws/AgentGateway";
import { AdminHub } from "./core/ws/AdminHub";

// If you want to type req.auth:
declare module "http" {
    interface IncomingMessage {
        auth?: { locationId: string; apiKey?: string };
    }
}

const app = express();
const port = env.PORT || 3000;

const server = http.createServer(app);

// WebSocket servers (noServer; we route manually)
const wssAgent = new WebSocketServer({ noServer: true });
const wssAdmin = new WebSocketServer({ noServer: true });

// Wire WS servers to features
new AgentGateway(wssAgent).init(); // handles agent connections and updates agentsPool
new AdminHub(wssAdmin).init();     // streams pool events/snapshot to admins

// --- Preview relay wiring (Admin <-> Backend <-> Agent) ---
type AdminClient = WebSocket;
const watchers = new Map<string, Set<AdminClient>>(); // locationId -> admin clients

function getAgentSocket(locationId: string): WebSocket | undefined {
    return agentsPool.get(locationId)?.ws;
}

function subscribeWatcher(locationId: string, ws: AdminClient) {
    let set = watchers.get(locationId);
    if (!set) watchers.set(locationId, (set = new Set()));
    set.add(ws);

    // If this is the first viewer, ask the agent to start preview
    if (set.size === 1) {
        const agentWs = getAgentSocket(locationId);
        agentWs?.send(JSON.stringify({ type: "command", cmd: "startPreview", fps: 10, quality: 6 }));
    }
}

function unsubscribeWatcher(locationId: string, ws: AdminClient) {
    const set = watchers.get(locationId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
        // Last viewer left → stop preview at agent
        const agentWs = getAgentSocket(locationId);
        agentWs?.send(JSON.stringify({ type: "command", cmd: "stopPreview" }));
    }
}

function removeFromAllWatchLists(ws: AdminClient) {
    for (const [loc, set] of watchers) {
        if (set.delete(ws) && set.size === 0) {
            const agentWs = getAgentSocket(loc);
            agentWs?.send(JSON.stringify({ type: "command", cmd: "stopPreview" }));
        }
    }
}

// Agents send binary MJPEG frames; fan-out to subscribed admins.
wssAgent.on("connection", (agentWs, req) => {
    const locationId = (req as any).auth?.locationId as string;
    agentWs.on("message", (data, isBinary) => {
        if (!isBinary) return;
        const set = watchers.get(locationId);
        if (!set || set.size === 0) return;
        for (const admin of set) {
            if (admin.readyState === admin.OPEN) {
                // zero-copy forward
                admin.send(data, { binary: true });
            }
        }
    });
});

// Admin connections: handle preview subscribe/unsubscribe commands
wssAdmin.on("connection", (ws) => {
    const onMsg = (raw: WebSocket.RawData) => {
        let msg: any;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        console.log('received admin command', msg);
        if (msg?.type === "preview-start" && msg.locationId) {
            subscribeWatcher(msg.locationId, ws);
        }
        if (msg?.type === "preview-stop" && msg.locationId) {
            unsubscribeWatcher(msg.locationId, ws);
        }
        if (msg?.type === "start_recording" && msg.locationId) {
            const locationId: string = msg.locationId;
            const agent = agentsPool.get(locationId);

            if (!agent || agent.readyState !== agent.OPEN) {
                console.error('Agent not found or not active for location', locationId);
                ws.send(JSON.stringify({
                    type: "start_recording_ack",
                    status: "error",
                    error: "agent offline",
                    locationId,
                    durationMinutes: msg.durationSec / 60 || 2
                }));
                return;
            } else {
                agent.ws?.send(JSON.stringify({
                    type: 'command',
                    cmd: 'startRecording',
                    locationId: locationId,
                    durationMinutes: msg.durationSec / 60 || 2
                }));
            }
        }
    };
    ws.on("message", onMsg);
    ws.on("close", () => removeFromAllWatchLists(ws));
    ws.on("error", () => removeFromAllWatchLists(ws));
});

// -----------------------------------------------------------------------------

const upload = multer({ storage: multer.memoryStorage() });

app.use(requestLogger);

app.post("/api/public/stripe-webhooks", express.raw({ type: "application/json" }), StripeWebhooksController.handleWebhook);

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173", // Your frontend URL
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "Range"],
    })
);

app.use((req, res, next) => {
    res.header("Access-Control-Expose-Headers", "Content-Range");
    next();
});

// Apply authentication middleware globally
app.use(authenticateToken);

// Admin Invitations
app.get("/api/admin/invitations", AdminInvitationsController.list);
app.post("/api/admin/invitations", AdminInvitationsController.create);

// Admin Users Routes
app.get("/api/admin/users", AdminUsersController.list);

app.get("/api/admin/sport-locations", AdminSportLocationController.list);
app.post("/api/admin/sport-locations", AdminSportLocationController.create);
app.put("/api/admin/sport-locations/:id", AdminSportLocationController.update);
app.delete("/api/admin/sport-locations/:id", AdminSportLocationController.delete);
app.post("/api/admin/sport-locations/:id/image", upload.single("file"), AdminSportLocationController.uploadThumbnail);

// Admin Tickets Routes
app.get("/api/admin/tickets", AdminTicketsController.list);

// Public + Payments
app.get("/api/public/location-by-slang/:slug", SportLocationController.getSportLocationBySlang);
app.get("/api/public/purchase-order/:id", PaymentController.getPurchaseOrder);
app.post("/api/public/purchase-order", PaymentController.createPurchaseOrderAnonymous);
app.post("/api/public/purchase-order/:id/payment-intent", PaymentController.createPaymentIntentForPurchaseOrder);

// Auth Routes
app.post("/api/auth/register", AuthController.register);
app.post("/api/auth/delete", AuthController.deleteUser);
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/oauth-login", AuthController.loginWithExternalProvider);
app.post("/api/auth/logout", AuthController.logout);
app.post("/api/auth/update-profile", AuthController.updateUser);
app.post("/api/auth/update-notifications", AuthController.updateUserNotificationPreferences);
app.post("/api/auth/update-password", AuthController.updatePassword);
app.post("/api/auth/forgot-password", AuthController.forgotPassword);
app.post("/api/auth/reset-password", AuthController.resetPassword);
app.post("/api/auth/confirm-email", AuthController.confirmEmail);

// Protected Routes
app.get("/api/user/profile", UserController.getProfile);
app.get("/api/user/payments", PaymentController.getPayments);

// Support Routes
app.get("/api/tickets", SupportController.getUserTickets);
app.get("/api/tickets/:id", SupportController.getTicketById);
app.put("/api/tickets/:id", SupportController.updateTicket);
app.patch("/api/tickets/:id/status", SupportController.updateTicketStatus);
app.delete("/api/tickets/:id", SupportController.deleteTicket);
app.post("/api/public/contact", SupportController.handleContactMessage);

app.get("/", (_req, res) => {
    res.send("Hello, TypeScript + Express!");
});

// Global error handler
app.use(ErrorHandler as ErrorRequestHandler);

// ---- Upgrade routing/auth (single authoritative router) ----

function rejectUpgrade(socket: any, code: number, message: string) {
    const body = message + "\n";
    socket.write(
        `HTTP/1.1 ${code} ${message}\r\n` +
        `Connection: close\r\n` +
        `Content-Type: text/plain; charset=utf-8\r\n` +
        `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n` +
        body
    );
    socket.destroy();
}

server.on("upgrade", async (req: IncomingMessage & { auth?: any }, socket, head) => {
    const { pathname /*, searchParams*/ } = new URL(req.url || "/", "http://local");
    console.log('upgrade received');
    if (pathname === "/agents") {
        const apiKey = req.headers["x-api-key"] as string | undefined;
        const locationId = req.headers["x-location-id"] as string | undefined;
        if (!apiKey || !locationId) return rejectUpgrade(socket, 401, "Missing auth");

        try {
            const foundLocation: ISportLocation | null = await SportLocation.findById(locationId);
            if (!foundLocation) return rejectUpgrade(socket, 404, "Location not found");
            // if (foundLocation.apiKey !== apiKey) return rejectUpgrade(socket, 403, "Forbidden");
        } catch (e) {
            console.error(e);
            return rejectUpgrade(socket, 500, "Internal error");
        }

        req.auth = { locationId, apiKey };
        return wssAgent.handleUpgrade(req, socket, head, (ws) => {
            wssAgent.emit("connection", ws, req);
        });
    }

    if (pathname === "/admin") {
        // Add Origin/cookie/JWT checks here if needed
        return wssAdmin.handleUpgrade(req, socket, head, (ws) => {
            wssAdmin.emit("connection", ws, req);
        });
    }

    return rejectUpgrade(socket, 404, "Not Found");
});

// ---- Start ----
connectToMongoose().then(() => {
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`WebSocket server running on ws://localhost:${port}`); // ws (TLS-terminates upstream if any)
    });
});
