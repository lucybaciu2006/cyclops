import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    adminWs: WebSocket | null;
    locationId: string;
    fps?: number;     // default 10
    quality?: number; // default 6 (2 best .. 31 worst)
    playing?: boolean; // subscribe only when true
    canvasClassName?: string; // customize display size
    placeholderUrl?: string; // snapshot cover before start / first frame
    fillParent?: boolean; // make internal wrapper take full size
};

export default function CameraPreview({ adminWs, locationId, fps = 1, quality = 8, playing = false, canvasClassName, placeholderUrl, fillParent = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const activeRef = useRef(false);
    const [cacheKey, setCacheKey] = useState<number>(() => Date.now());
    const refreshMs = 30_000; // refresh snapshot every 30s by default

    useEffect(() => {
        const ws = adminWs;
        if (!ws) return;

        // ensure we get ArrayBuffer (faster than Blob decoding path)
        try { (ws as any).binaryType = "arraybuffer"; } catch {}

        const handleMessage = (ev: MessageEvent) => {
            // We expect binary frames tagged with our custom header "MJPG"
            if (!(ev.data instanceof ArrayBuffer)) return;

            const buf = new DataView(ev.data);
            if (buf.byteLength < 16) return;

            // magic "MJPG"
            const m0 = buf.getUint8(0), m1 = buf.getUint8(1), m2 = buf.getUint8(2), m3 = buf.getUint8(3);
            if (m0 !== 0x4d || m1 !== 0x4a || m2 !== 0x50 || m3 !== 0x47) return; // 'M','J','P','G'

            const headerW = buf.getUint16(12, false); // BE (if provided by agent)
            const headerH = buf.getUint16(14, false);

            const jpegBytes = new Uint8Array(ev.data, 16);
            const blob = new Blob([jpegBytes], { type: "image/jpeg" });

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Ensure canvas bitmap matches CSS box for crisp rendering
            const cssW = canvas.clientWidth || 0;
            const cssH = canvas.clientHeight || 0;
            const dpr = (window.devicePixelRatio || 1);
            const targetW = Math.max(1, Math.round(cssW * dpr));
            const targetH = Math.max(1, Math.round(cssH * dpr));
            if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
            }

            // draw with letterboxing (fit, never stretch)
            createImageBitmap(blob).then((bmp) => {
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Clear to black background
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const destW = canvas.width;
                const destH = canvas.height;
                const fw = (bmp.width || headerW || 1);
                const fh = (bmp.height || headerH || 1);
                const srcRatio = fw / fh;
                const destRatio = destW / destH; // container ratio

                let drawW: number, drawH: number, dx: number, dy: number;
                if (srcRatio > destRatio) {
                    // fit by width
                    drawW = destW;
                    drawH = Math.round(destW / srcRatio);
                    dx = 0;
                    dy = Math.round((destH - drawH) / 2);
                } else {
                    // fit by height
                    drawH = destH;
                    drawW = Math.round(destH * srcRatio);
                    dy = 0;
                    dx = Math.round((destW - drawW) / 2);
                }
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high" as any;
                ctx.drawImage(bmp, dx, dy, drawW, drawH);
            }).catch(() => {});
        };

        const sendWhenOpen = (payload: any) => {
            const text = JSON.stringify(payload);
            if (ws.readyState === WebSocket.OPEN) {
                try { ws.send(text); } catch {}
            } else if (ws.readyState === WebSocket.CONNECTING) {
                const onOpen = () => {
                    try { ws.send(text); } catch {}
                    ws.removeEventListener("open", onOpen);
                };
                ws.addEventListener("open", onOpen);
            } else {
                // CLOSED or CLOSING: ignore; effect will rerun on new socket instance
            }
        };

        const start = () => {
            if (activeRef.current) return;
            activeRef.current = true;
            ws.addEventListener("message", handleMessage);
            // subscribe to preview for this location
            sendWhenOpen({ type: "preview-start", locationId, fps, quality });
        };

        const stop = () => {
            if (!activeRef.current) return;
            activeRef.current = false;
            ws.removeEventListener("message", handleMessage);
            // unsubscribe
            if (ws.readyState === WebSocket.OPEN) {
                try { ws.send(JSON.stringify({ type: "preview-stop", locationId })); } catch {}
            }
        };

        // no special reset needed
        if (playing) start();
        // If not playing, ensure any previous subscription is stopped
        return stop;
    }, [adminWs, locationId, fps, quality, playing]);

    // Refresh placeholder snapshot periodically while it's visible (only when paused)
    useEffect(() => {
        if (!placeholderUrl || playing) return;
        const id = setInterval(() => setCacheKey(Date.now()), refreshMs);
        return () => clearInterval(id);
    }, [placeholderUrl, playing]);

    const coverSrc = useMemo(() => {
        if (!placeholderUrl) return undefined;
        const sep = placeholderUrl.includes("?") ? "&" : "?";
        return `${placeholderUrl}${sep}t=${cacheKey}`;
    }, [placeholderUrl, cacheKey]);

    return (
        <div className={fillParent ? "flex flex-col gap-2 h-full" : "flex flex-col gap-2"}>
            <div className={fillParent ? "relative w-full h-full bg-black rounded-lg" : "relative bg-black rounded-lg"}>
                {/* snapshot cover only when paused */}
                {coverSrc && !playing && (
                    <img src={coverSrc} alt="snapshot" className="absolute inset-0 z-10 w-full h-full object-contain rounded-lg pointer-events-none" />
                )}
                <canvas
                    ref={canvasRef}
                    className={(canvasClassName || "w-full rounded-lg bg-black") + " z-0"}
                    style={!playing ? { visibility: 'hidden' } : undefined}
                />
            </div>
            <div className="text-xs text-muted-foreground">
                {playing ? "Live preview" : "Paused"} · {fps} fps · quality {quality}
            </div>
        </div>
    );
}
