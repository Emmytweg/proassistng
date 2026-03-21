"use client";

import {
  Archive,
  CheckCircle2,
  Image,
  MailOpen,
  RefreshCw,
  Send,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Attachment = {
  name: string;
  size: string;
};

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  preview: string;
  timeLabel: string;
  receivedAtLabel: string;
  userId: string;
  signatureTitle?: string;
  unread?: boolean;
  starred?: boolean;
  status?: string;
  attachments?: Attachment[];
  body: string[];
};

type TabKey = "all" | "unread" | "starred";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("messages")
          .select(
            "id, sender_name, sender_email, user_ref, subject, body, attachments, starred, unread, status, received_at",
          )
          .order("received_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        if (!active) return;

        const mapped: Message[] = (data ?? []).map((r: any) => {
          const receivedAt = r.received_at
            ? new Date(r.received_at)
            : new Date();
          const timeLabel = receivedAt.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
          const receivedAtLabel = receivedAt.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const bodyText = String(r.body ?? "");
          const bodyParts = bodyText
            .split(/\n\s*\n/g)
            .map((p: string) => p.trim())
            .filter(Boolean);
          const preview = bodyText.replace(/\s+/g, " ").trim().slice(0, 140);
          const rawAttachments = r.attachments;
          const attachments: Attachment[] = Array.isArray(rawAttachments)
            ? rawAttachments
                .map((a: any) => ({
                  name: String(a?.name ?? "attachment"),
                  size: String(a?.size ?? ""),
                }))
                .filter((a: Attachment) => !!a.name)
            : [];

          return {
            id: String(r.id),
            name: String(r.sender_name ?? "Unknown"),
            email: String(r.sender_email ?? ""),
            subject: String(r.subject ?? "(no subject)"),
            preview: preview || "—",
            timeLabel,
            receivedAtLabel,
            userId: String(r.user_ref ?? ""),
            unread: !!r.unread,
            starred: !!r.starred,
            status: String(r.status ?? "open"),
            attachments: attachments.length ? attachments : undefined,
            body: bodyParts.length ? bodyParts : [bodyText || "—"],
          };
        });

        setMessages(mapped.length ? mapped : []);
        setSelectedId((prev) => prev || mapped[0]?.id || "");
        setReadState((prev) => {
          const next = { ...prev };
          for (const m of mapped) {
            if (next[m.id] === undefined) next[m.id] = !(m.unread ?? false);
          }
          return next;
        });
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load messages.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      const isRead = readState[m.id] ?? true;
      const isUnread = !isRead;
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "unread"
            ? isUnread
            : !!m.starred;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    });
  }, [activeTab, query, messages, readState]);

  const selected = useMemo(
    () =>
      messages.find((m) => m.id === selectedId) ?? filtered[0] ?? messages[0],
    [selectedId, filtered, messages],
  );

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background sm:-m-6 lg:-m-8 lg:flex-row">
      {/* Messages list */}
      <section className="w-full border-b border-border bg-card/60 overflow-hidden lg:w-2/5 lg:min-w-88 lg:border-b-0 lg:border-r">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/70 p-4 backdrop-blur">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={
                "px-3 py-1 text-xs font-bold rounded-full transition-colors " +
                (activeTab === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={
                "px-3 py-1 text-xs font-medium rounded-full transition-colors " +
                (activeTab === "unread"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("starred")}
              className={
                "px-3 py-1 text-xs font-medium rounded-full transition-colors " +
                (activeTab === "starred"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              Starred
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-primary text-xs font-bold hover:underline"
              onClick={() => {
                setReadState((prev) => {
                  const next = { ...prev };
                  for (const m of messages) next[m.id] = true;
                  return next;
                });
              }}
            >
              Mark all read
            </button>
            <button
              type="button"
              aria-label="Refresh"
              title="Refresh"
              onClick={() => setFetchKey((k) => k + 1)}
              disabled={loading}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-40"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="max-h-[42vh] overflow-y-auto divide-y divide-border lg:max-h-none lg:h-full">
          {loadError ? (
            <div className="p-6 text-sm text-destructive bg-destructive/10 border-b border-destructive/20">
              {loadError}
            </div>
          ) : null}
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading messages...
            </div>
          ) : null}
          {filtered.map((m) => {
            const isSelected = selected?.id === m.id;
            const isRead = readState[m.id] ?? true;
            const isUnread = !isRead;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedId(m.id);
                  setReadState((prev) => ({ ...prev, [m.id]: true }));
                }}
                className={
                  "w-full p-3 text-left transition-colors sm:p-4 " +
                  (isSelected
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-muted/40")
                }
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {m.name}
                    </h3>
                    {isUnread ? (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    ) : null}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {m.timeLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 truncate font-medium">
                  {m.email}
                </p>
                <h4
                  className={
                    "text-sm mb-1 truncate " +
                    (isSelected
                      ? "font-semibold text-primary italic"
                      : "font-medium text-foreground")
                  }
                >
                  {m.subject}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {m.preview}
                </p>
              </button>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">
              No messages found.
            </div>
          ) : null}
        </div>
      </section>

      {/* Detail panel */}
      <section className="flex w-full min-h-0 flex-col overflow-hidden bg-background lg:w-3/5">
        {/* Actions bar */}
        <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                title="Archive"
                disabled={!selected}
                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors disabled:opacity-40"
                onClick={async () => {
                  if (!selected) return;
                  const supabase = getSupabaseBrowserClient();
                  await supabase
                    .from("messages")
                    .update({ status: "archived" })
                    .eq("id", selected.id);
                  setMessages((prev) =>
                    prev.filter((m) => m.id !== selected.id),
                  );
                  const next = filtered.find((m) => m.id !== selected.id);
                  setSelectedId(next?.id ?? "");
                  setToast({ type: "success", message: "Message archived." });
                }}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Delete"
                disabled={!selected}
                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors disabled:opacity-40"
                onClick={async () => {
                  if (!selected) return;
                  const supabase = getSupabaseBrowserClient();
                  await supabase
                    .from("messages")
                    .delete()
                    .eq("id", selected.id);
                  setMessages((prev) =>
                    prev.filter((m) => m.id !== selected.id),
                  );
                  const next = filtered.find((m) => m.id !== selected.id);
                  setSelectedId(next?.id ?? "");
                  setToast({ type: "success", message: "Message deleted." });
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="mx-1 h-6 w-px bg-border sm:mx-2" />
              <button
                type="button"
                title="Mark as unread"
                disabled={!selected}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
                onClick={async () => {
                  if (!selected) return;
                  setReadState((prev) => ({ ...prev, [selected.id]: false }));
                  const supabase = getSupabaseBrowserClient();
                  await supabase
                    .from("messages")
                    .update({ unread: true })
                    .eq("id", selected.id);
                }}
              >
                <MailOpen className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!selected}
              title={
                selected?.status === "resolved"
                  ? "Mark as Open"
                  : "Mark as Resolved"
              }
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:opacity-40 sm:px-4 sm:text-sm ${
                selected?.status === "resolved"
                  ? "bg-muted text-muted-foreground hover:bg-muted/70"
                  : "bg-primary/10 text-primary hover:bg-primary/15"
              }`}
              onClick={async () => {
                if (!selected) return;
                const newStatus =
                  selected.status === "resolved" ? "open" : "resolved";
                const supabase = getSupabaseBrowserClient();
                await supabase
                  .from("messages")
                  .update({ status: newStatus })
                  .eq("id", selected.id);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === selected.id ? { ...m, status: newStatus } : m,
                  ),
                );
                setToast({
                  type: "success",
                  message:
                    newStatus === "resolved"
                      ? "Marked as resolved."
                      : "Marked as open.",
                });
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {selected?.status === "resolved"
                ? "Mark as Open"
                : "Mark as Resolved"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {selected ? (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                    {initials(selected.name) || "U"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {selected.email} • User ID: {selected.userId}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs font-bold text-muted-foreground">
                    RECEIVED
                  </p>
                  <p className="text-sm font-medium text-foreground/80">
                    {selected.receivedAtLabel}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <h1 className="mb-4 border-b border-border pb-4 text-base font-bold text-foreground sm:text-lg">
                  Subject: {selected.subject}
                </h1>
                <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
                  {selected.body.map((p, idx) => (
                    <p key={idx} className="text-foreground/80 leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {selected.attachments?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                      {selected.attachments.map((a) => (
                        <div
                          key={a.name}
                          className="border border-border rounded-xl p-3 flex items-center gap-3 bg-muted/30"
                        >
                          <Image className="w-4 h-4 text-primary" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold truncate">
                              {a.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {a.size}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className="text-foreground/80 leading-relaxed pt-4">
                    Best regards,
                    <br />
                    <strong>{selected.name}</strong>
                    {selected.signatureTitle ? (
                      <>
                        <br />
                        {selected.signatureTitle}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted sm:flex">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  {selected.email ? (
                    <p className="text-xs text-muted-foreground mb-2">
                      Reply will be sent to{" "}
                      <span className="font-semibold text-foreground">
                        {selected.email}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 mb-2 font-medium">
                      ⚠ No email address on this message — reply cannot be
                      delivered.
                    </p>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-30 resize-none"
                    placeholder={
                      selected.email
                        ? `Type your reply to ${selected.name}…`
                        : "No email address available."
                    }
                    disabled={!selected.email || replySending}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={
                        !selected.email || !replyText.trim() || replySending
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-bold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      onClick={async () => {
                        if (!selected.email || !replyText.trim()) return;
                        setReplySending(true);
                        try {
                          const res = await fetch("/api/send-reply", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: selected.email,
                              toName: selected.name,
                              subject: selected.subject,
                              replyBody: replyText.trim(),
                            }),
                          });
                          const json = await res.json();
                          if (!res.ok)
                            throw new Error(json.error ?? "Failed to send.");
                          setToast({
                            type: "success",
                            message: `Reply sent to ${selected.email}`,
                          });
                          setReplyText("");
                        } catch (err) {
                          setToast({
                            type: "error",
                            message:
                              err instanceof Error
                                ? err.message
                                : "Failed to send reply.",
                          });
                        } finally {
                          setReplySending(false);
                        }
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {replySending ? "Sending…" : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-sm text-muted-foreground">
              Select a message.
            </div>
          )}
        </div>
      </section>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="reply-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed bottom-4 left-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium shadow-xl sm:bottom-6 sm:left-auto sm:right-6 ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
