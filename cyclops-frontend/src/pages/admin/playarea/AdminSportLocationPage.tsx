// AdminSportLocationPage.tsx
import {useState, useMemo, useEffect} from "react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, Pencil, Video, Camera } from "lucide-react"; // <-- add Video, Camera
import {SportLocation} from "@/model/sport-location.ts";
import {AdminService} from "@/services/AdminService.ts";
import SportLocationDialog from "@/pages/admin/playarea/SportLocationDialog.tsx";
import {toast} from "sonner";
import ConfirmDialogService from "@/components/confirm-dialog/ConfirmDialogService.ts";
import {useAdminAgents} from "@/hooks/useAdminAgents.ts";
import CameraPreviewModal from "@/pages/admin/playarea/CameraPreviewModal.tsx";
import TelemetryModal from "@/pages/admin/playarea/TelemetryModal.tsx";

export default function AdminSportLocationPage() {
    const [areas, setAreas] = useState<SportLocation[]>([]);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<SportLocation | null>(null);

    // PREVIEW modal state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLocId, setPreviewLocId] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");
    // TELEMETRY modal state
    const [telemetryOpen, setTelemetryOpen] = useState(false);
    const [telemetryLocName, setTelemetryLocName] = useState<string>("");
    const [telemetryData, setTelemetryData] = useState<any | null>(null);

    const { status: wsStatus, agentsByLocation, adminWs } = useAdminAgents();

    const fetchData = () => { AdminService.getPlayAreas().then(setAreas); };
    useEffect(() => { fetchData(); }, []);

    const filteredAreas = useMemo(
        () => areas.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
        [areas, search]
    );

    const handleDelete = async (id: string) => {
        ConfirmDialogService.open({
            title: "Delete Location",
            confirmCallback: () => {
                AdminService.deleteSportLocation(id).then(() => {
                    toast.success("Location deleted");
                    fetchData();
                });
            },
        });
    };

    const openCreateDialog = () => { setEditItem(null); setDialogOpen(true); };
    const openEditDialog   = (location: SportLocation) => { setEditItem(location); setDialogOpen(true); };
    const handleEditSuccess   = () => { toast.success("Location updated"); setDialogOpen(false); fetchData(); };
    const handleCreateSuccess = () => { toast.success("Location created"); setDialogOpen(false); fetchData(); };

    // PREVIEW
    const openPreview = (loc: SportLocation) => {
        setPreviewLocId(loc._id);
        setPreviewTitle(`${loc.name} — Live camera`);
        setPreviewOpen(true);
    };

    const openTelemetry = (loc: SportLocation) => {
        const agent = agentsByLocation[loc._id];
        setTelemetryData(agent?.telemetry ?? null);
        setTelemetryLocName(`${loc.name} — Telemetry`);
        setTelemetryOpen(true);
    };

    // --- NEW: start recording via admin WebSocket ---
    const requestRecording = (loc: SportLocation) => {
        if (!adminWs || adminWs.readyState !== WebSocket.OPEN) {
            toast.error("Admin socket is not connected.");
            return;
        }
        const agent = agentsByLocation[loc._id];
        if (!agent || agent.status !== "connected") {
            toast.error("Device is offline.");
            return;
        }

        // quick MVP prompt for duration (minutes)
        const minStr = window.prompt("Record duration (minutes):", "10");
        if (minStr === null) return; // canceled
        const minutes = Number(minStr);
        if (!Number.isFinite(minutes) || minutes <= 0) {
            toast.error("Please enter a valid positive number.");
            return;
        }

        const durationSec = Math.round(minutes * 60);
        const recordingId = `rec_${loc._id}_${Date.now()}`;

        const msg = {
            // The backend should forward this to the agent for that location
            type: "start_recording",
            locationId: loc._id,
            recordingId,
            durationSec,
            segmentSeconds: 60,
            useLastDevice: true,
            // optionally pass storage hints; backend can fill defaults:
            // bucket: "cyclops-vod-dev",
            // gcsPrefix: `loc/${loc._id}/rec/${recordingId}`,
            metadata: { locationName: loc.name }
        };

        try {
            adminWs.send(JSON.stringify(msg));
            toast.success(`Recording requested for ${minutes} min`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to send recording request.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Sport Locations</h1>

                <div className="text-sm text-gray-500">
                    Admin socket:{" "}
                    <span className="inline-flex items-center gap-2">
            <span
                className={`h-2 w-2 rounded-full ${
                    wsStatus === "connected" ? "bg-green-500"
                        : wsStatus === "reconnecting" ? "bg-yellow-500"
                            : "bg-gray-400"
                }`}
            />
                        {wsStatus}
          </span>
                </div>

                <Button onClick={openCreateDialog}>Create New</Button>
            </div>

            <Input
                placeholder="Search areas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            <div className="border rounded-md">
                <table className="w-full table-auto">
                    <thead className="bg-gray-100">
                    <tr className="text-left">
                        <th className="px-4 py-2"></th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Slug</th>
                        <th className="px-4 py-2">Address</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">CPU</th>
                        <th className="px-4 py-2">RAM</th>
                        <th className="px-4 py-2">Disk</th>
                        <th className="px-4 py-2 w-48 text-center">Actions</th>{/* widened */}
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAreas.map((area) => {
                        const agent = agentsByLocation[area._id];
                        const online = agent?.status === "connected";
                        const tele = agent?.telemetry;

                        const fmtBytes = (n?: number) => {
                            if (!n && n !== 0) return "-";
                            const units = ["B", "KB", "MB", "GB", "TB"];
                            let v = n; let i = 0;
                            while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
                            return `${v.toFixed(1)} ${units[i]}`;
                        };

                        const cpuPct = tele?.cpu?.usagePercent as number | undefined;
                        const memUsed = tele?.memory?.used as number | undefined;
                        const memTotal = tele?.memory?.total as number | undefined;
                        const diskUsed = tele?.disk?.used as number | undefined;
                        const diskTotal = tele?.disk?.total as number | undefined;

                        const colorForPct = (pct?: number) => {
                            if (pct == null) return "text-gray-500";
                            if (pct < 60) return "text-green-600";
                            if (pct < 85) return "text-yellow-600";
                            return "text-red-600";
                        };

                        const memPct = (memUsed != null && memTotal ? (memUsed / memTotal) * 100 : undefined);
                        const diskPct = (diskUsed != null && diskTotal ? (diskUsed / diskTotal) * 100 : undefined);

                        return (
                            <tr key={area._id} className="border-t">
                                <td style={{ height: 42 }}>
                                    <img style={{ maxHeight: "100%" }} src={area.image?.url} />
                                </td>
                                <td className="px-4 py-2">{area.name}</td>
                                <td className="px-4 py-2">{area.slug}</td>
                                <td className="px-4 py-2">{area.address}</td>

                                <td className="px-4 py-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="inline-flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`} />
                                            <span className="text-sm text-gray-700">{online ? "agent: online" : "agent: offline"}</span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${agent?.camera?.reachable ? "bg-green-500" : "bg-gray-400"}`} />
                                            <span className="text-xs text-gray-600">{agent?.camera?.reachable ? "camera: online" : "camera: offline"}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* CPU */}
                                <td className={`px-4 py-2 font-medium ${colorForPct(cpuPct ?? undefined)}`}>
                                    {cpuPct != null ? `${cpuPct.toFixed(0)}%` : '-'}
                                </td>
                                {/* RAM */}
                                <td className={`px-4 py-2 font-medium ${colorForPct(memPct)}`}>
                                    {(memUsed != null && memTotal != null) ? `${fmtBytes(memUsed)} / ${fmtBytes(memTotal)}` : '-'}
                                </td>
                                {/* Disk */}
                                <td className={`px-4 py-2 font-medium ${colorForPct(diskPct)}`}>
                                    {(diskUsed != null && diskTotal != null) ? `${fmtBytes(diskUsed)} / ${fmtBytes(diskTotal)}` : '-'}
                                </td>

                                <td className="px-4 py-2 flex justify-center gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(area)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>

                                    {/* NEW: Preview action */}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => openPreview(area)}
                                        disabled={!online || wsStatus !== "connected"}
                                        className="inline-flex items-center gap-2"
                                        title={online ? "Open live preview" : "Device offline"}
                                    >
                                        <Camera className="w-4 h-4" />
                                        Preview
                                    </Button>

                                    {/* Record action */}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => requestRecording(area)}
                                        disabled={!online || wsStatus !== "connected"}
                                        className="inline-flex items-center gap-2"
                                        title={online ? "Request a recording" : "Device offline"}
                                    >
                                        <Video className="w-4 h-4" />
                                        Record
                                    </Button>

                                    {/* See all stats */}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => openTelemetry(area)}
                                        disabled={!tele}
                                    >
                                        See all stats
                                    </Button>

                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(area._id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredAreas.length === 0 && (
                        <tr>
                            <td colSpan={9} className="text-center px-4 py-6 text-gray-500">
                                No areas found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* PREVIEW MODAL */}
            {previewLocId && (
                <CameraPreviewModal
                    open={previewOpen}
                    onOpenChange={(v) => setPreviewOpen(v)}
                    adminWs={adminWs}
                    locationId={previewLocId}
                    title={previewTitle}
                />
            )}

            {/* TELEMETRY MODAL */}
            <TelemetryModal
                open={telemetryOpen}
                onOpenChange={setTelemetryOpen}
                title={telemetryLocName}
                telemetry={telemetryData}
            />

            <SportLocationDialog
                initialData={editItem}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onUpdate={handleEditSuccess}
                onCreateSuccess={handleCreateSuccess}
            />
        </div>
    );
}
