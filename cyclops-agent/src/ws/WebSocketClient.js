"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
class WebSocketClient {
    constructor(opts) {
        this.opts = opts;
        this.ws = null;
        this.reconnectDelayMs = 1000;
        this.heartbeatTimer = null;
    }
    sendJson(json) {
        try {
            if (this.ws && this.ws.readyState === ws_1.default.OPEN)
                this.ws.send(JSON.stringify(json));
        }
        catch (_a) { }
    }
    sendBinary(buf) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN)
            this.ws.send(buf);
    }
    connect() {
        var _a, _b;
        try {
            this.ws = new ws_1.default(this.opts.url, { headers: this.opts.headers });
            this.ws.on('open', () => {
                var _a, _b;
                this.reconnectDelayMs = 1000;
                (_b = (_a = this.opts).onOpen) === null || _b === void 0 ? void 0 : _b.call(_a);
                this.startHeartbeat();
            });
            this.ws.on('ping', () => { var _a; try {
                (_a = this.ws) === null || _a === void 0 ? void 0 : _a.pong();
            }
            catch (_b) { } });
            this.ws.on('message', (data) => {
                var _a, _b;
                try {
                    const obj = JSON.parse(data.toString());
                    (_b = (_a = this.opts).onMessage) === null || _b === void 0 ? void 0 : _b.call(_a, obj);
                }
                catch (_c) {
                    // ignore non-JSON
                }
            });
            this.ws.on('close', (code, reason) => {
                var _a, _b;
                this.stopHeartbeat();
                (_b = (_a = this.opts).onClose) === null || _b === void 0 ? void 0 : _b.call(_a, code, reason.toString());
                this.scheduleReconnect();
            });
            this.ws.on('error', (err) => {
                var _a, _b, _c;
                (_b = (_a = this.opts).onError) === null || _b === void 0 ? void 0 : _b.call(_a, err);
                try {
                    (_c = this.ws) === null || _c === void 0 ? void 0 : _c.close();
                }
                catch (_d) { }
                if (this.ws && this.ws.readyState !== ws_1.default.CLOSING && this.ws.readyState !== ws_1.default.CLOSED) {
                    this.scheduleReconnect();
                }
            });
        }
        catch (e) {
            this.scheduleReconnect();
            (_b = (_a = this.opts).onError) === null || _b === void 0 ? void 0 : _b.call(_a, e);
        }
    }
    startHeartbeat() {
        var _a;
        this.stopHeartbeat();
        if (!this.opts.buildHeartbeat)
            return;
        const interval = (_a = this.opts.heartbeatIntervalMs) !== null && _a !== void 0 ? _a : 15000;
        this.heartbeatTimer = setInterval(() => {
            var _a, _b;
            const heartbeat = (_b = (_a = this.opts).buildHeartbeat) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (heartbeat)
                this.sendJson(heartbeat);
        }, interval);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    scheduleReconnect() {
        this.stopHeartbeat();
        const delay = Math.min(this.reconnectDelayMs, 30000);
        setTimeout(() => this.connect(), delay);
        this.reconnectDelayMs = Math.min(delay * 2, 30000);
    }
}
exports.WebSocketClient = WebSocketClient;
