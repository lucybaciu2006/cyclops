import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMemo } from "react";

type ISO = string;

export type TelemetrySnapshot = {
  cpu?: { usagePercent?: number | null; model?: string; cores?: number; speedMhz?: number };
  memory?: { total?: number; free?: number; used?: number; usedPercent?: number };
  disk?: { total?: number; free?: number; used?: number; usedPercent?: number };
  uptimeSec?: number;
  timestamp?: ISO;
  // allow any extra data for raw view
  [k: string]: any;
};

export function TelemetryModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  telemetry?: TelemetrySnapshot | null;
}) {
  const { open, onOpenChange, title, telemetry } = props;

  const pretty = useMemo(() => {
    if (!telemetry) return "No telemetry";
    try {
      return JSON.stringify(telemetry, null, 2);
    } catch {
      return String(telemetry);
    }
  }, [telemetry]);

  const fmtBytes = (n?: number) => {
    if (!n && n !== 0) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  const uptime = telemetry?.uptimeSec ?? undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? "Telemetry"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">CPU</div>
              <div className="font-medium">{telemetry?.cpu?.usagePercent != null ? `${telemetry?.cpu?.usagePercent.toFixed(0)}%` : '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">RAM</div>
              <div className="font-medium">
                {telemetry?.memory?.used != null && telemetry?.memory?.total != null
                  ? `${fmtBytes(telemetry.memory.used)} / ${fmtBytes(telemetry.memory.total)}`
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Disk</div>
              <div className="font-medium">
                {telemetry?.disk?.used != null && telemetry?.disk?.total != null
                  ? `${fmtBytes(telemetry.disk.used)} / ${fmtBytes(telemetry.disk.total)}`
                  : '-'}
              </div>
            </div>
          </div>

          {uptime != null && (
            <div className="text-xs text-muted-foreground">Uptime: ~{Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600)/60)}m</div>
          )}

          <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-[50vh]">
{pretty}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TelemetryModal;

