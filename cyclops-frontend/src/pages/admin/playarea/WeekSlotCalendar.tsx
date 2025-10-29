import { useMemo } from 'react';
import { RecordingSession } from '@/model/recording-session';

type Props = {
  weekStart: Date;          // Monday 00:00
  sessions: RecordingSession[];
  slotMinutes?: number;     // default 30
  loading?: boolean;
};

function dayKeyOf(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hoursMinutes(slot: number, slotMinutes: number) {
  const totalMinutes = slot * slotMinutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function WeekSlotCalendar({ weekStart, sessions, slotMinutes = 30, loading }: Props) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [weekStart]);

  // Map of dayKey -> array of session indices (or -1 if free)
  const { perDayIdx, palette } = useMemo(() => {
    const map = new Map<string, number[]>();
    const slotsPerDay = Math.ceil(24 * 60 / slotMinutes);
    for (const d of days) map.set(dayKeyOf(d), Array(slotsPerDay).fill(-1));
    // deterministic color palette by session index
    const colors = [
      '#94a3b8', '#60a5fa', '#34d399', '#f59e0b', '#f472b6',
      '#22d3ee', '#a78bfa', '#fb7185', '#84cc16', '#eab308'
    ];
    sessions.forEach((s, idx) => {
      const arr = map.get(s.dayKey);
      if (!arr) return;
      const end = Math.min(arr.length, s.slotIndex + s.duration);
      for (let i = s.slotIndex; i < end; i++) arr[i] = idx;
    });
    return { perDayIdx: map, palette: colors };
  }, [days, sessions, slotMinutes]);

  const slotsPerDay = Math.ceil(24 * 60 / slotMinutes);
  // Start at 08:00 unless there is data earlier in the day
  const eightAMSlot = Math.floor(8 * 60 / slotMinutes);
  let earliestBusy: number | undefined = undefined;
  for (const arr of perDayIdx.values()) {
    const idx = arr.findIndex((v) => v >= 0);
    if (idx !== -1) earliestBusy = earliestBusy == null ? idx : Math.min(earliestBusy, idx);
  }
  const startSlot = earliestBusy == null || earliestBusy >= eightAMSlot ? eightAMSlot : Math.max(0, earliestBusy);
  const slots = slotsPerDay - startSlot;

  return (
    <div className="overflow-auto border rounded">
      <table className="w-full min-w-[900px] table-fixed">
        <thead>
          <tr className="bg-muted text-muted-foreground text-sm">
            <th className="w-20 p-2 text-left">Time</th>
            {days.map((d, idx) => (
              <th key={idx} className="p-2 text-left">
                {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: slots }).map((_, r) => (
            <tr key={r} className="border-t">
              <td className="p-1 text-xs text-muted-foreground align-top">
                {(((startSlot + r) * slotMinutes) % 60 === 0)
                  ? hoursMinutes(startSlot + r, slotMinutes)
                  : ''}
              </td>
              {days.map((d, c) => {
                const key = dayKeyOf(d);
                const sIdx = perDayIdx.get(key)?.[startSlot + r] ?? -1;
                const color = sIdx >= 0 ? palette[sIdx % palette.length] : 'transparent';
                return (
                  <td
                    key={c}
                    className="p-0 border-b"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: sIdx >= 0 ? color : undefined,
                    }}
                  >
                    <div
                      className="h-6 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="p-2 text-sm text-muted-foreground">Loading schedule…</div>
      )}
    </div>
  );
}
