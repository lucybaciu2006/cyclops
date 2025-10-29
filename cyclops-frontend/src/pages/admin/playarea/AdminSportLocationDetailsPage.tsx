import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminService } from '@/services/AdminService';
import { SportLocation } from '@/model/sport-location';
import { RecordingSession } from '@/model/recording-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAgents } from '@/hooks/useAdminAgents';
import CameraPreview from './CameraPreview';

import WeekSlotCalendar from './WeekSlotCalendar';

function fmtDayKey(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  // aim Monday as first day; convert Sunday (0) to 6
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AdminSportLocationDetailsPage() {
  const { id } = useParams();
  const [location, setLocation] = useState<SportLocation | null>(null);
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [jobs, setJobs] = useState<any[]>([]);

  const { adminWs, agentsByLocation } = useAdminAgents();
  const agent = id ? agentsByLocation[id] : undefined;
  const [playing, setPlaying] = useState(false);
  const [recordMinutes, setRecordMinutes] = useState<number>(10);
  const [segmentSeconds, setSegmentSeconds] = useState<number>(60);
  const [instantMinutes, setInstantMinutes] = useState<number>(10);
  const now = new Date();
  // default start time rounded to next 30 minutes
  const rounded = new Date(now);
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 30) * 30, 0, 0);
  const [startDate, setStartDate] = useState<string>(() => fmtDayKey(rounded));
  const [startTime, setStartTime] = useState<string>(() => `${rounded.getHours().toString().padStart(2,'0')}:${rounded.getMinutes().toString().padStart(2,'0')}`);

  const times30min: string[] = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  const canSendWs = !!adminWs && adminWs.readyState === WebSocket.OPEN;

  const handleStartRecording = async () => {
    if (!location || !id) return;
    const minutes = Math.max(1, Math.floor(recordMinutes || 0));
    const seg = Math.max(5, Math.floor(segmentSeconds || 0));
    // Compose local date+time to a Date object
    const dtLocal = new Date(`${startDate}T${startTime}:00`);
    const startTimeMs = dtLocal.getTime();
    // Preferred: compute dayKey + slotIndex to avoid TZ issues
    const [hStr, mStr] = startTime.split(':');
    const slotIndex = parseInt(hStr, 10) * 60 / 30 + (parseInt(mStr, 10) >= 30 ? 1 : 0);
    try {
      await AdminService.createRecordingSession({
        locationId: id,
        userId: 'admin',
        // send both for compatibility, backend will prefer slots
        startTimeMs,
        dayKey: startDate,
        slotIndex,
        durationMinutes: minutes,
        slotMinutes: 30,
        metadata: { segmentSeconds: seg, locationName: location.name },
      });
      // Refresh the week schedule
      await fetchSessions();
    } catch (e) {
      // rely on axios interceptor to toast
      console.error(e);
    }
  };

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const fetchLocation = async () => {
    if (!id) return;
    const loc = await AdminService.getPlayArea(id);
    setLocation(loc);
  };

  const fetchSessions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fromDay = fmtDayKey(weekStart);
      const toDay = fmtDayKey(weekEnd);
      const data = await AdminService.getRecordingSessions({ locationId: id, fromDay, toDay });
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!id) return;
    try {
      const data = await AdminService.getRecentRecordingJobs(id, 10);
      setJobs(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchLocation(); fetchJobs(); }, [id]);
  useEffect(() => { fetchSessions(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, weekStart.getTime()]);

  const goPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d));
  };
  const goNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d));
  };

  if (!id) return <div className="p-4">Missing location id</div>;

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link to="/admin/sport-locations">
            <Button variant="secondary">Back</Button>
          </Link>
          <h1 className="text-2xl font-semibold">Location Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!canSendWs}>Record</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2">
              <DropdownMenuLabel>Recording Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-2 gap-3 p-2">
                <div className="col-span-2">
                  <Label htmlFor="rec-date">Start date</Label>
                  <Input id="rec-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Start time (30 min)</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {times30min.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="rec-min">Duration (minutes)</Label>
                  <Input id="rec-min" type="number" min={30} step={30} value={recordMinutes} onChange={(e) => setRecordMinutes(parseInt(e.target.value || '0', 10))} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="seg-sec">Segment length (seconds)</Label>
                  <Input id="seg-sec" type="number" min={5} value={segmentSeconds} onChange={(e) => setSegmentSeconds(parseInt(e.target.value || '0', 10))} />
                </div>
                <div className="col-span-2 flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setPlaying(true)}>Preview</Button>
                  <Button variant="secondary" onClick={async () => {
                    if (!id) return;
                    try {
                      await AdminService.startAgentRecording(id, Math.max(1, Math.floor(recordMinutes || 0)), { from: 'admin' });
                      await fetchJobs();
                    } catch (e) { console.error(e); }
                  }}>Start now</Button>
                  <Button onClick={handleStartRecording}>Create</Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Start instant job: only duration */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Start instant job</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2">
              <DropdownMenuLabel>Instant Job</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-2 gap-3 p-2">
                <div className="col-span-2">
                  <Label htmlFor="instant-min">Duration (minutes)</Label>
                  <Input id="instant-min" type="number" min={1} value={instantMinutes} onChange={(e) => setInstantMinutes(parseInt(e.target.value || '0', 10))} />
                </div>
                <div className="col-span-2 flex justify-end gap-2 pt-1">
                  <Button
                    onClick={async () => {
                      if (!id) return;
                      try {
                        const mins = Math.max(1, Math.floor(instantMinutes || 0));
                        await AdminService.startAgentRecording(id, mins, { from: 'admin-instant' });
                        await fetchJobs();
                      } catch (e) { console.error(e); }
                    }}
                  >
                    Start
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {location && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 1) Image + details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{location.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <img src={location.image?.url} alt="thumbnail" className="w-full max-h-32 object-contain rounded border bg-muted" />
                <div className="text-sm text-muted-foreground">
                  <div>Slug: {location.slug}</div>
                  <div>Address: {location.address}</div>
                  <div>Sport: {location.sport}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2) Live preview with hover controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="group relative w-full" style={{ aspectRatio: "4640 / 1728", minHeight: 160 }}>
                <CameraPreview
                  adminWs={adminWs}
                  locationId={id}
                  playing={playing}
                  canvasClassName="absolute inset-0 w-full h-full rounded-lg bg-black"
                  placeholderUrl={location.snapshotUrl}
                  fillParent
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="pointer-events-auto bg-black/50 rounded-full p-2">
                    {!playing ? (
                      <Button size="sm" variant="secondary" onClick={() => setPlaying(true)}>Play</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setPlaying(false)}>Pause</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3) Agent stats */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Agent Stats</CardTitle>
            </CardHeader>
              <CardContent>
                {(() => {
                  const tele = agent?.telemetry;
                  const fmtBytes = (n?: number) => {
                  if (n == null) return '-';
                  const u = ['B','KB','MB','GB','TB'];
                  let v = n, i = 0; while (v >= 1024 && i < u.length-1) { v/=1024; i++; }
                  return `${v.toFixed(1)} ${u[i]}`;
                };
                const usageColor = (pct?: number) => pct == null ? 'text-gray-500' : pct < 60 ? 'text-green-600' : pct < 85 ? 'text-yellow-600' : 'text-red-600';
                const cpu = tele?.cpu?.usagePercent ?? null;
                const memTotal = tele?.memory?.total ?? null;
                const memUsed  = tele?.memory?.used ?? null;
                const diskTotal = tele?.disk?.total ?? null;
                const diskUsed  = tele?.disk?.used ?? null;
                const memPct = (memUsed!=null && memTotal) ? (memUsed/memTotal)*100 : undefined;
                const diskPct = (diskUsed!=null && diskTotal) ? (diskUsed/diskTotal)*100 : undefined;
                return (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`inline-block h-2 w-2 rounded-full ${agent?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      Agent: {agent?.status || 'unknown'}
                      {agent?.camera?.ip ? ` · Camera ${agent.camera.reachable ? 'online' : 'offline'} (${agent.camera.ip})` : ''}
                      {agent?.activity ? ` · State ${agent.activity}` : ''}
                    </div>
                    <div>
                      <div className="text-muted-foreground">CPU</div>
                      <div className={`font-medium ${usageColor(cpu ?? undefined)}`}>{cpu!=null ? `${cpu.toFixed(0)}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-medium">{tele?.uptimeSec ? `${Math.floor(tele.uptimeSec/3600)}h` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Memory</div>
                      <div className={`font-medium ${usageColor(memPct)}`}>{(memUsed!=null && memTotal!=null) ? `${fmtBytes(memUsed)} / ${fmtBytes(memTotal)}` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Disk</div>
                      <div className={`font-medium ${usageColor(diskPct)}`}>{(diskUsed!=null && diskTotal!=null) ? `${fmtBytes(diskUsed)} / ${fmtBytes(diskTotal)}` : '-'}</div>
                    </div>
                  </div>
                );
              })()}
              </CardContent>
          </Card>

          {/* 4) Recent jobs */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {jobs.slice(0, 10).map((j: any) => {
                  const dt = new Date(j.startTimeMs);
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const when = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
                  const status = j.status as string;
                  const color = status === 'RECORDING' ? 'bg-green-500' : status === 'COMPLETED' ? 'bg-gray-400' : status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500';
                  return (
                    <li key={j._id} className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                      <span className="flex-1 truncate">{when} · {j.durationMinutes}m</span>
                      <span className="text-xs text-muted-foreground">{j.status}</span>
                    </li>
                  );
                })}
                {jobs.length === 0 && (
                  <li className="text-muted-foreground text-sm">No jobs yet</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule (week)</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goPrevWeek}>Prev</Button>
              <div className="text-sm text-muted-foreground">
                {fmtDayKey(weekStart)} — {fmtDayKey(weekEnd)}
              </div>
              <Button variant="outline" onClick={goNextWeek}>Next</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <WeekSlotCalendar
            weekStart={weekStart}
            sessions={sessions}
            slotMinutes={30}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
