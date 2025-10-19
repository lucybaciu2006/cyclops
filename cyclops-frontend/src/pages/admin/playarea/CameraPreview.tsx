import { useEffect, useRef } from "react";

type Props = {
    adminWs: WebSocket | null;
    locationId: string;
    fps?: number;     // default 10
    quality?: number; // default 6 (2 best .. 31 worst)
};

export default function CameraPreview({ adminWs, locationId, fps = 10, quality = 6 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const activeRef = useRef(false);

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

            const w = buf.getUint16(12, false); // BE
            const h = buf.getUint16(14, false);

            const jpegBytes = new Uint8Array(ev.data, 16);
            const blob = new Blob([jpegBytes], { type: "image/jpeg" });

            const canvas = canvasRef.current;
            if (!canvas) return;
            if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

            // draw
            createImageBitmap(blob).then((bmp) => {
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(bmp, 0, 0);
            }).catch(() => {});
        };

        const start = () => {
            if (activeRef.current) return;
            activeRef.current = true;
            ws.addEventListener("message", handleMessage);
            // subscribe to preview for this location
            ws.send(JSON.stringify({ type: "preview-start", locationId, fps, quality }));
        };

        const stop = () => {
            if (!activeRef.current) return;
            activeRef.current = false;
            ws.removeEventListener("message", handleMessage);
            // unsubscribe
            try { ws.send(JSON.stringify({ type: "preview-stop", locationId })); } catch {}
        };

        start();
        return stop;
    }, [adminWs, locationId, fps, quality]);

    return (
        <div className="flex flex-col gap-2">
            <canvas
                ref={canvasRef}
                className="w-full rounded-lg bg-black"
                // canvas will be resized to video’s native w/h internally; CSS controls display size
                style={{ aspectRatio: "16 / 9" }}
            />
            <div className="text-xs text-muted-foreground">
                Live preview · {fps} fps · quality {quality}
            </div>
        </div>
    );
}
