import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AdminService, AdminUser } from "@/services/AdminService.ts";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // basic pagination to avoid huge payloads; tune as needed
      const { data } = await AdminService.getUsers({ page: 1, perPage: 200, sort: ["createdAt", "DESC"] });
      setUsers(data as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)));
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="text-sm text-gray-500">{loading ? "Loading..." : `${filtered.length} users`}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchUsers}>Refresh</Button>
        </div>
      </div>

      <Input
        placeholder="Search users by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Properties</th>
              <th className="px-4 py-2">Credits</th>
              <th className="px-4 py-2">Trial Left</th>
              <th className="px-4 py-2">Created</th>
              {/* add more columns later if needed */}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.name || '-'}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-2 text-sm ${u.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                    {u.isActive ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">{(u as any).propertiesCount ?? 0}</td>
                <td className="px-4 py-2">{(u as any).creditsConsumed ?? 0}</td>
                <td className="px-4 py-2">{formatDuration((u as any).trialSecondsLeft)}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{formatDate((u as any).createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center px-4 py-6 text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
}

function formatDuration(sec?: number) {
  if (sec == null) return '-';
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
