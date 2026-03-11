"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Trash2, Download } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Subscriber = {
  id: string;
  email: string;
  subscribed_at: string;
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("subscribers")
        .select("id, email, subscribed_at")
        .order("subscribed_at", { ascending: false });

      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setSubscribers(data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [fetchKey]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("subscribers").delete().eq("id", id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  }

  function handleExport() {
    const csv = [
      "Email,Subscribed At",
      ...subscribers.map(
        (s) => `${s.email},${new Date(s.subscribed_at).toLocaleString()}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Loading…"
              : `${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Refresh"
            onClick={() => setFetchKey((k) => k + 1)}
            disabled={loading}
            className="p-2 rounded-lg border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || subscribers.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading subscribers…
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">No subscribers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Subscribed</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map((s, i) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-4 font-medium">{s.email}</td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(s.subscribed_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      title="Remove subscriber"
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
