#!/usr/bin/env python3
# Fast manual tracker via ffmpeg pipe
# Behavior:
#   - SPACE -> start playback AND start collecting
#   - SPACE again -> pause playback AND pause collecting
#   - Mouse just sets position (no toggling)
#   - Q / ESC or window X -> save & quit
#
# Output lines: "hh:mm:ss.mmm<TAB>x<TAB>y" (x,y in ORIGINAL video pixels)

import sys, json, time, subprocess
from datetime import timedelta
import numpy as np
import cv2

# ===================== USER SETTINGS =====================
VIDEO_PATH        = r"a.mp4"  # your big file
OUTPUT_TXT        = "track.txt"

PREVIEW_WIDTH     = 1280          # preview width (960–1280 recommended)
PREVIEW_FPS       = 15            # preview frame rate (10–20 is plenty)
PLAY_SPEED        = 1.0           # 1.0=realtime, >1 faster, <1 slower
SAMPLE_RATE_HZ    = 2.0           # how often to log while RUNNING (samples/sec)

FFMPEG_EXE        = "ffmpeg"      # path/name of ffmpeg (must be in PATH or set full path)
FFPROBE_EXE       = "ffprobe"     # path/name of ffprobe (same)
WINDOW_NAME       = "Fast Tracker (ffmpeg pipe)"

# If we ever get behind by more than this (seconds), drop frames to catch up.
# Set to 0.0 to NEVER drop (strict pacing).
MAX_LAG_TO_DROP   = 0.0
# ========================================================

def fmt_ts_ms(ms: float) -> str:
    td = timedelta(milliseconds=ms)
    s = str(td)
    return s if "." in s else s + ".000"

def ffprobe_size(path: str):
    cmd = [FFPROBE_EXE, "-v", "error",
           "-select_streams", "v:0",
           "-show_entries", "stream=width,height",
           "-of", "json", path]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {p.stderr or p.stdout}")
    data = json.loads(p.stdout)
    st = data["streams"][0]
    return int(st["width"]), int(st["height"])

def build_ffmpeg_pipe(path: str, out_w: int, out_h: int, out_fps: float):
    vf = f"scale={out_w}:{out_h}:flags=fast_bilinear,fps={out_fps}"
    cmd = [
        FFMPEG_EXE, "-hide_banner", "-loglevel", "warning",
        "-hwaccel", "auto",
        "-i", path,
        "-an",
        "-vf", vf,
        "-pix_fmt", "bgr24",
        "-f", "rawvideo",
        "pipe:1",
    ]
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def read_frame(proc_stdout, h: int, w: int, bpp: int = 3):
    need = h * w * bpp
    buf = proc_stdout.read(need)
    if len(buf) != need:
        return None
    return np.frombuffer(buf, np.uint8).reshape((h, w, 3)).copy()  # writable

def main():
    # 1) Probe original size
    try:
        orig_w, orig_h = ffprobe_size(VIDEO_PATH)
    except Exception as e:
        print("ERROR: ffprobe failed.", e); sys.exit(1)

    # 2) Compute preview size
    out_w = int(PREVIEW_WIDTH)
    out_h = int(round(orig_h * (out_w / float(orig_w))))
    out_h -= (out_h % 2)

    # 3) Start ffmpeg pipe
    proc = build_ffmpeg_pipe(VIDEO_PATH, out_w, out_h, PREVIEW_FPS)
    if proc.stdout is None:
        print("ERROR: could not open ffmpeg stdout pipe."); sys.exit(1)

    # 4) GUI
    cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WINDOW_NAME, out_w, out_h)

    # State
    running = False          # playback + collecting state (both tied to SPACE)
    last_mouse = (None, None)
    samples = []             # (timestamp_ms, x_orig, y_orig)
    sample_period_ms = 1000.0 / max(1e-6, SAMPLE_RATE_HZ)
    last_sample_ms = None

    # Timing (strict pacing): frame i at preview fps -> i / (PREVIEW_FPS * PLAY_SPEED) seconds
    frame_idx = 0
    wall_anchor = None      # perf_counter() at start/resume
    frame_anchor = 0        # frame_idx at start/resume

    # Mouse handler: only track position; do NOT toggle on click
    def on_mouse(event, x, y, flags, param):
        nonlocal last_mouse
        # update on any mouse event
        last_mouse = (x, y)

    cv2.setMouseCallback(WINDOW_NAME, on_mouse)

    # Read first frame & wait SPACE to start (paused initially)
    first_frame = read_frame(proc.stdout, out_h, out_w)
    if first_frame is None:
        print("ERROR: couldn't read first frame from ffmpeg. Is the file valid?")
        proc.kill(); sys.exit(1)

    print(f"Original: {orig_w}x{orig_h} | Preview: {out_w}x{out_h} @ {PREVIEW_FPS}fps")
    print("SPACE=start/stop (both playback & collecting), Q/ESC=quit")

    # Idle/paused loop (show still frame until SPACE)
    current_frame = first_frame.copy()
    while not running:
        try:
            if cv2.getWindowProperty(WINDOW_NAME, cv2.WND_PROP_VISIBLE) < 1:
                proc.kill(); cv2.destroyAllWindows(); return
        except cv2.error:
            proc.kill(); cv2.destroyAllWindows(); return

        disp = current_frame.copy()
        cv2.putText(disp, "PAUSED — press SPACE to START", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,0), 4, cv2.LINE_AA)
        cv2.putText(disp, "PAUSED — press SPACE to START", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,255,255), 2, cv2.LINE_AA)
        if last_mouse[0] is not None:
            cv2.drawMarker(disp, (int(last_mouse[0]), int(last_mouse[1])),
                           (0,255,0), markerType=cv2.MARKER_CROSS, markerSize=12, thickness=2)
        cv2.imshow(WINDOW_NAME, disp)

        k = cv2.waitKey(20) & 0xFF
        if k in (27, ord('q'), ord('Q')):
            proc.kill(); cv2.destroyAllWindows(); return
        if k == 32:  # SPACE -> start playback+collecting
            running = True
            wall_anchor = time.perf_counter()
            frame_anchor = frame_idx  # currently 0
            last_sample_ms = None
            print("[INFO] START")
            break

    # Live FPS meter
    fps_count = 0
    fps_t0 = time.perf_counter()
    live_fps = 0.0

    # Main loop
    while True:
        # allow window X close
        try:
            if cv2.getWindowProperty(WINDOW_NAME, cv2.WND_PROP_VISIBLE) < 1:
                break
        except cv2.error:
            break

        if running:
            # read next frame; if stream ended -> break
            nf = read_frame(proc.stdout, out_h, out_w)
            if nf is None:
                break
            current_frame = nf
            frame_idx += 1

            # ts for this preview frame
            preview_ms = (frame_idx / PREVIEW_FPS) * 1000.0

            # strict pacing
            target_time = wall_anchor + ((frame_idx - frame_anchor) / (PREVIEW_FPS * max(1e-6, PLAY_SPEED)))
            now = time.perf_counter()
            remaining = target_time - now
            if remaining > 0:
                time.sleep(remaining)
            else:
                if MAX_LAG_TO_DROP > 0.0 and (-remaining) > MAX_LAG_TO_DROP:
                    # drop frames to catch up
                    while True:
                        ahead = (time.perf_counter() - wall_anchor) * (PREVIEW_FPS * max(1e-6, PLAY_SPEED))
                        if (frame_idx - frame_anchor) <= ahead:
                            break
                        junk = read_frame(proc.stdout, out_h, out_w)
                        if junk is None:
                            break
                        current_frame = junk
                        frame_idx += 1
                        preview_ms = (frame_idx / PREVIEW_FPS) * 1000.0

            # map mouse (preview) -> original
            if last_mouse[0] is not None:
                scale_x = orig_w / float(out_w)
                scale_y = orig_h / float(out_h)
                x_orig = int(last_mouse[0] * scale_x)
                y_orig = int(last_mouse[1] * scale_y)
            else:
                x_orig = y_orig = None

            # sample while running
            if x_orig is not None:
                if last_sample_ms is None or (preview_ms - last_sample_ms) >= sample_period_ms:
                    samples.append((preview_ms, x_orig, y_orig))
                    last_sample_ms = preview_ms

            # FPS meter
            fps_count += 1
            if time.perf_counter() - fps_t0 >= 1.0:
                live_fps = fps_count / (time.perf_counter() - fps_t0)
                fps_count = 0
                fps_t0 = time.perf_counter()

            # HUD
            disp = current_frame.copy()
            if last_mouse[0] is not None:
                cv2.drawMarker(disp, (int(last_mouse[0]), int(last_mouse[1])),
                               (0,255,0), markerType=cv2.MARKER_CROSS, markerSize=12, thickness=2)
            hud = f"RUNNING | t={fmt_ts_ms(preview_ms)} | n={len(samples)} | {PLAY_SPEED}x | prev_fps~{live_fps:.1f}"
            cv2.putText(disp, hud, (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,0), 3, cv2.LINE_AA)
            cv2.putText(disp, hud, (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2, cv2.LINE_AA)
            cv2.imshow(WINDOW_NAME, disp)

        else:
            # paused: do NOT read from pipe (this effectively pauses ffmpeg)
            disp = current_frame.copy()
            if last_mouse[0] is not None:
                cv2.drawMarker(disp, (int(last_mouse[0]), int(last_mouse[1])),
                               (0,255,0), markerType=cv2.MARKER_CROSS, markerSize=12, thickness=2)
            cv2.putText(disp, "PAUSED — press SPACE to RESUME", (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,0), 4, cv2.LINE_AA)
            cv2.putText(disp, "PAUSED — press SPACE to RESUME", (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,255,255), 2, cv2.LINE_AA)
            cv2.imshow(WINDOW_NAME, disp)

        # keys (work in both states)
        k = cv2.waitKey(1) & 0xFF
        if k in (27, ord('q'), ord('Q')):
            break
        if k == 32:  # SPACE toggles play+collect
            running = not running
            now = time.perf_counter()
            if running:
                # re-anchor so resume stays in sync
                elapsed_frames = (frame_idx - frame_anchor)
                elapsed_time = elapsed_frames / (PREVIEW_FPS * max(1e-6, PLAY_SPEED))
                wall_anchor = now - elapsed_time
                print("[INFO] RESUME")
            else:
                # paused
                print("[INFO] PAUSE")

    # cleanup
    try: proc.kill()
    except: pass
    cv2.destroyAllWindows()

    # save
    with open(OUTPUT_TXT, "w", encoding="utf-8") as f:
        for t_ms, x, y in samples:
            f.write(f"{fmt_ts_ms(t_ms)}\t{x}\t{y}\n")
    print(f"[OK] Saved {len(samples)} samples → {OUTPUT_TXT}")

if __name__ == "__main__":
    main()
