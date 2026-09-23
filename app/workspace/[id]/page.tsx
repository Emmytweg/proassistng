"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Paperclip,
  ShieldCheck,
  Video,
  Send,
  Download,
  FileText,
  Plus,
  MoreHorizontal,
  PhoneCall,
  Bell,
  Search,
  UserRound,
  PhoneOff,
  Inbox,
  CheckCheck,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { API_ENDPOINTS, readApiError } from "@/lib/api";
import type { RealtimeChannel } from "@supabase/supabase-js";

const statusClass = {
  pending: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  awaiting_client: "bg-amber-100 text-amber-700",
  revision_requested: "bg-orange-100 text-orange-700",
  submitted: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

type WorkspaceRow = {
  id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  status?: string | null;
  client_email?: string | null;
  freelancer_email?: string | null;
  freelancer_id?: string | null;
  freelancer_name?: string | null;
  client_name?: string | null;
  amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  deadline?: string | null;
  scheduled_deletion_at?: string | null;
};

type MessageRow = {
  id: string;
  project_id: string;
  sender_id?: string | null;
  sender_name: string;
  content: string;
  created_at?: string | null;
  read_at?: string | null;
};

type FileRow = {
  id: string;
  project_id: string;
  file_name: string;
  file_size: number;
  file_type?: string | null;
  storage_path: string;
  created_at?: string | null;
  uploaded_by?: string | null;
};

type CallRow = {
  id: string;
  caller_id?: string | null;
  status?: string | null;
  metadata?: {
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    caller_name?: string;
    media_type?: "voice" | "video";
  } | null;
};

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [userName, setUserName] = useState("You");
  const [tab, setTab] = useState<
    "overview" | "messages" | "files" | "activity"
  >("overview");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingStatus, setTypingStatus] = useState("No one is typing");
  const [callState, setCallState] = useState<
    "idle" | "ringing" | "live" | "ended"
  >("idle");
  const [callMode, setCallMode] = useState<"voice" | "video">("voice");
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<"client" | "freelancer" | null>(
    null,
  );
  const [statusConfirmation, setStatusConfirmation] = useState<{
    isOpen: boolean;
    newStatus: string;
  }>({ isOpen: false, newStatus: "" });
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!projectId) return;

    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        const email = user?.email?.toLowerCase() ?? "";
        const userId = user?.id ?? "";
        currentUserIdRef.current = userId || null;

        if (!user) {
          router.replace(
            `/workspace/redirect?project_id=${encodeURIComponent(projectId)}`,
          );
          return;
        }

        if (user) {
          setUserName(
            user.user_metadata?.full_name || user.email?.split("@")[0] || "You",
          );
        }

        const { data: workspaceData, error: workspaceError } = await supabase
          .from("project_workspaces")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();

        if (workspaceError) throw workspaceError;
        if (!workspaceData) {
          setError("Project not found or you do not have access.");
          return;
        }

        const isAuthorized =
          (workspaceData.client_email &&
            email &&
            workspaceData.client_email.toLowerCase() === email) ||
          (workspaceData.freelancer_email &&
            email &&
            workspaceData.freelancer_email.toLowerCase() === email) ||
          (workspaceData.freelancer_id &&
            userId &&
            workspaceData.freelancer_id === userId);

        if (!isAuthorized) {
          setError(
            "This workspace is private and not available to your account.",
          );
          return;
        }

        // Determine user role
        if (
          workspaceData.client_email &&
          email &&
          workspaceData.client_email.toLowerCase() === email
        ) {
          setUserRole("client");
        } else if (
          (workspaceData.freelancer_email &&
            email &&
            workspaceData.freelancer_email.toLowerCase() === email) ||
          (workspaceData.freelancer_id &&
            userId &&
            workspaceData.freelancer_id === userId)
        ) {
          setUserRole("freelancer");
        }

        if (active) {
          setWorkspace(workspaceData as WorkspaceRow);
          const { data: messageData } = await supabase
            .from("project_messages")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

          const { data: fileData } = await supabase
            .from("project_files")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

          const { data: activityData } = await supabase
            .from("project_activity")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

          const { data: notificationData } = await supabase
            .from("project_notifications")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(8);

          const safeMessages = (messageData as MessageRow[]) ?? [];
          const storedReadAt = Number(
            localStorage.getItem(`proassistng-workspace-read:${projectId}`) ??
              "0",
          );
          const computedUnread = safeMessages.filter((message) => {
            if (!message.created_at) return false;
            return new Date(message.created_at).getTime() > storedReadAt;
          }).length;

          setMessages(safeMessages);
          setFiles((fileData as FileRow[]) ?? []);
          setActivity((activityData as any[]) ?? []);
          setNotifications((notificationData as any[]) ?? []);
          setUnreadCount(computedUnread);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load this project workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [projectId, router]);

  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (callState !== "live" || !callStartedAtRef.current) return;

    const tick = () => {
      setCallDuration(
        Math.floor((Date.now() - callStartedAtRef.current!) / 1000),
      );
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (!projectId || !workspace) return;

    const supabase = getSupabaseBrowserClient();
    const loadIncomingCall = async () => {
      const { data } = await supabase
        .from("project_calls")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(5);

      const incoming = (data ?? []).find(
        (record: CallRow) =>
          record.caller_id !== currentUserIdRef.current &&
          record.metadata?.offer,
      );

      setIncomingCall(incoming ?? null);
    };

    const channel = supabase.channel(`project:${projectId}`);
    realtimeChannelRef.current = channel;

    const subscription = channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const incoming = payload?.message as MessageRow | undefined;
        if (!incoming) return;

        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id))
            return current;
          const next = [...current, incoming].sort((left, right) =>
            String(left.created_at ?? "").localeCompare(
              String(right.created_at ?? ""),
            ),
          );
          syncUnreadCount(next);
          return next;
        });
      })
      .on("broadcast", { event: "call-signal" }, async ({ payload }) => {
        if (payload?.sender_id === currentUserIdRef.current) return;

        if (payload?.type === "offer" && payload.call) {
          setIncomingCall(payload.call);
          return;
        }

        if (
          payload?.type === "answer" &&
          payload.call_id === activeCallIdRef.current &&
          payload.answer &&
          peerConnectionRef.current &&
          peerConnectionRef.current.signalingState === "have-local-offer"
        ) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.answer),
          );
          setCallState("live");
          callStartedAtRef.current = Date.now();
          setCallDuration(0);
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.sender_id === currentUserIdRef.current) return;
        setTypingStatus(
          payload?.isTyping
            ? `${payload.sender_name ?? "Someone"} is typing…`
            : "No one is typing",
        );
        if (payload?.isTyping) {
          window.setTimeout(() => setTypingStatus("No one is typing"), 1800);
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages((current) => {
            const incoming = payload.new as MessageRow;
            if (current.some((message) => message.id === incoming.id))
              return current;
            const next = [...current, incoming];
            syncUnreadCount(next);
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_files",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setFiles((current) => [payload.new as FileRow, ...current]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_activity",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setActivity((current) => [payload.new as any, ...current]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_notifications",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const incoming = payload.new as any;
          setNotifications((current) => {
            if (current.some((item) => item.id === incoming.id)) return current;
            return [incoming, ...current].slice(0, 8);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_calls",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          if (
            record?.metadata?.offer &&
            record.id !== activeCallIdRef.current
          ) {
            setIncomingCall(record);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_calls",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          if (!record?.metadata) return;

          if (
            record.id === activeCallIdRef.current &&
            record.metadata?.answer &&
            peerConnectionRef.current &&
            peerConnectionRef.current.signalingState === "have-local-offer"
          ) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(record.metadata.answer),
            );
            setCallState("live");
            callStartedAtRef.current = Date.now();
            return;
          }

          if (
            record?.metadata?.offer &&
            record.id !== activeCallIdRef.current
          ) {
            setIncomingCall(record);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_workspaces",
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          const updated = payload.new as WorkspaceRow;
          setWorkspace(updated);
        },
      )
      .subscribe();

    void loadIncomingCall();
    const incomingCallPoll = window.setInterval(() => {
      void loadIncomingCall();
    }, 3000);

    return () => {
      void subscription;
      window.clearInterval(incomingCallPoll);
      realtimeChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [projectId, workspace]);

  const displayStatus = workspace?.status
    ? String(workspace.status).replace(/_/g, " ")
    : "Pending";

  const safeMessages = useMemo(() => messages, [messages]);

  const syncUnreadCount = (nextMessages: MessageRow[]) => {
    const key = `proassistng-workspace-read:${projectId}`;
    const stored = Number(localStorage.getItem(key) ?? "0");
    const count = nextMessages.filter((message) => {
      if (!message.created_at) return false;
      return new Date(message.created_at).getTime() > stored;
    }).length;
    setUnreadCount(count);
  };

  const markMessagesRead = () => {
    if (!projectId) return;
    const now = Date.now();
    localStorage.setItem(
      `proassistng-workspace-read:${projectId}`,
      String(now),
    );
    setMessages((current) =>
      current.map((message) => ({
        ...message,
        read_at: message.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  };

  async function getTurnServers(): Promise<RTCIceServer[]> {
    try {
      const response = await fetch(API_ENDPOINTS.turnCredentials, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          await readApiError(response, "TURN credentials are unavailable."),
        );
      }

      const body = (await response.json()) as { iceServers?: RTCIceServer[] };
      if (!Array.isArray(body.iceServers) || body.iceServers.length === 0) {
        throw new Error("TURN credentials are unavailable.");
      }

      return body.iceServers;
    } catch (error) {
      console.warn(
        "Failed to fetch TURN servers, falling back to public STUN:",
        error,
      );
      return [{ urls: "stun:stun.l.google.com:19302" }];
    }
  }

  async function ensurePeerConnection() {
    if (typeof window === "undefined" || !("RTCPeerConnection" in window)) {
      throw new Error("WebRTC is not supported in this browser.");
    }

    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection({ iceServers: await getTurnServers() });

    pc.ontrack = (event) => {
      const remoteStream = event.streams?.[0];
      if (remoteStream && audioRef.current) {
        audioRef.current.srcObject = remoteStream;
        audioRef.current.muted = false;
      }
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        setCallState("ended");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }

  async function waitForIceGathering(pc: RTCPeerConnection) {
    if (pc.iceGatheringState === "complete") return;

    await new Promise<void>((resolve) => {
      const handleGatheringStateChange = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener(
            "icegatheringstatechange",
            handleGatheringStateChange,
          );
          resolve();
        }
      };

      pc.addEventListener(
        "icegatheringstatechange",
        handleGatheringStateChange,
      );
      window.setTimeout(() => {
        pc.removeEventListener(
          "icegatheringstatechange",
          handleGatheringStateChange,
        );
        resolve();
      }, 10000);
    });
  }

  async function answerIncomingCall(record: any) {
    try {
      const pc = await ensurePeerConnection();
      const isVideoCall = record?.metadata?.media_type === "video";
      setCallMode(isVideoCall ? "video" : "voice");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall,
      });
      audioStreamRef.current = stream;
      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (!record?.metadata?.offer) return;

      await pc.setRemoteDescription(
        new RTCSessionDescription(record.metadata.offer),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);

      const supabase = getSupabaseBrowserClient();
      activeCallIdRef.current = record.id;
      setIncomingCall(null);
      const { error: answerUpdateError } = await supabase
        .from("project_calls")
        .update({
          status: "accepted",
          started_at: new Date().toISOString(),
          metadata: {
            ...record.metadata,
            answer: {
              type: pc.localDescription?.type ?? answer.type,
              sdp: pc.localDescription?.sdp ?? answer.sdp,
            },
          },
        })
        .eq("id", record.id);

      if (answerUpdateError) throw answerUpdateError;

      await realtimeChannelRef.current?.send({
        type: "broadcast",
        event: "call-signal",
        payload: {
          type: "answer",
          call_id: record.id,
          sender_id: currentUserIdRef.current,
          answer: {
            type: pc.localDescription?.type ?? answer.type,
            sdp: pc.localDescription?.sdp ?? answer.sdp,
          },
        },
      });

      setCallState("live");
      callStartedAtRef.current = Date.now();
      setCallDuration(0);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Unknown signaling error";
      setCallError(`Unable to join the call: ${message}`);
    }
  }

  async function recordProjectActivity(
    action: string,
    metadata: Record<string, unknown>,
  ) {
    if (!workspace) return;
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    const { data, error } = await supabase
      .from("project_activity")
      .insert({
        project_id: workspace.id,
        user_id: user?.id ?? null,
        action,
        metadata,
      })
      .select("*")
      .single();

    if (!error && data) {
      setActivity((current) => [data as any, ...current]);
    }
  }

  async function recordProjectNotification(type: string, message: string) {
    if (!workspace) return;
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    const { data } = await supabase
      .from("project_notifications")
      .insert({
        project_id: workspace.id,
        user_id: user?.id ?? null,
        type,
        message,
      })
      .select("*")
      .single();

    if (data) {
      setNotifications((current) => {
        if (current.some((item) => item.id === data.id)) return current;
        return [data, ...current].slice(0, 8);
      });
    }
  }

  async function startCall(mode: "voice" | "video") {
    if (!workspace || typeof navigator === "undefined") return;

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    try {
      setCallError(null);
      setCallState("ringing");
      setCallMode(mode);

      const pc = await ensurePeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });
      audioStreamRef.current = stream;
      if (localVideoRef.current && mode === "video") {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const { data: callData, error: callInsertError } = await supabase
        .from("project_calls")
        .insert({
          project_id: workspace.id,
          caller_id: user?.id ?? null,
          receiver_id: null,
          status: "initiated",
          metadata: { media_type: mode },
        })
        .select("*")
        .single();

      if (callInsertError) throw callInsertError;
      activeCallIdRef.current = callData.id;

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      const { error: offerUpdateError } = await supabase
        .from("project_calls")
        .update({
          status: "ringing",
          started_at: new Date().toISOString(),
          metadata: {
            caller_name: userName,
            media_type: mode,
            offer: {
              type: pc.localDescription?.type ?? offer.type,
              sdp: pc.localDescription?.sdp ?? offer.sdp,
            },
          },
        })
        .eq("id", callData.id);

      if (offerUpdateError) throw offerUpdateError;

      await realtimeChannelRef.current?.send({
        type: "broadcast",
        event: "call-signal",
        payload: {
          type: "offer",
          sender_id: currentUserIdRef.current,
          call: {
            ...callData,
            status: "ringing",
            metadata: {
              caller_name: userName,
              media_type: mode,
              offer: {
                type: pc.localDescription?.type ?? offer.type,
                sdp: pc.localDescription?.sdp ?? offer.sdp,
              },
            },
          },
        },
      });

      await recordProjectActivity("voice_call_started", {
        status: "ringing",
        caller_name: userName,
      });
      await recordProjectNotification(
        "voice_call_started",
        `${userName} started a voice call.`,
      );
    } catch (error) {
      console.error(error);
      setCallState("ended");
      const message =
        error instanceof Error ? error.message : "Unknown signaling error";
      setCallError(`Unable to start the call: ${message}`);
    }
  }

  async function startVoiceCall() {
    await startCall("voice");
  }

  async function startVideoCall() {
    await startCall("video");
  }

  async function endVoiceCall() {
    if (!workspace) return;

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const endTime = new Date().toISOString();
    const durationSeconds = callStartedAtRef.current
      ? Math.max(0, Math.floor((Date.now() - callStartedAtRef.current) / 1000))
      : callDuration;

    if (activeCallIdRef.current) {
      await supabase
        .from("project_calls")
        .update({
          status: "ended",
          ended_at: endTime,
          duration_seconds: durationSeconds,
        })
        .eq("id", activeCallIdRef.current);
    }

    await recordProjectActivity("voice_call_ended", {
      status: "ended",
      duration_seconds: durationSeconds,
      caller_name: user?.email?.split("@")[0] || userName,
    });
    await recordProjectNotification(
      "voice_call_ended",
      `${userName} ended the voice call.`,
    );

    activeCallIdRef.current = null;
    callStartedAtRef.current = null;
    setIncomingCall(null);
    setCallDuration(durationSeconds);
    setCallState("ended");
  }

  async function updateProjectStatus(newStatus: string) {
    if (!workspace) return;

    // Show confirmation dialog for "completed" status
    if (newStatus === "completed") {
      setStatusConfirmation({ isOpen: true, newStatus });
      return;
    }

    // For other status changes, update directly
    await performStatusUpdate(newStatus);
  }

  async function performStatusUpdate(newStatus: string) {
    if (!workspace) return;

    try {
      const supabase = getSupabaseBrowserClient();

      // If completing, schedule deletion for 48 hours from now
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "completed") {
        const deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() + 48);
        updateData.scheduled_deletion_at = deletionTime.toISOString();
      }

      const { error } = await supabase
        .from("project_workspaces")
        .update(updateData)
        .eq("id", workspace.id);

      if (error) {
        setError(`Failed to update status: ${error.message}`);
        return;
      }

      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              ...(newStatus === "completed" && {
                scheduled_deletion_at: new Date(
                  Date.now() + 48 * 60 * 60 * 1000,
                ).toISOString(),
              }),
            }
          : null,
      );
      setStatusConfirmation({ isOpen: false, newStatus: "" });
    } catch (err) {
      console.error(err);
      setError("Could not update project status.");
    }
  }

  async function handleSendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || !workspace || sending) return;

    setSending(true);
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    try {
      const { data: createdMessage, error } = await supabase
        .from("project_messages")
        .insert({
          project_id: workspace.id,
          sender_id: user?.id ?? null,
          sender_name: userName,
          content: trimmed,
        })
        .select("*")
        .single();

      if (error) throw error;
      await realtimeChannelRef.current?.send({
        type: "broadcast",
        event: "message",
        payload: { message: createdMessage as MessageRow },
      });
      await recordProjectActivity("message_sent", {
        sender_name: userName,
        content: trimmed,
      });
      setDraft("");
      const { data: refreshed } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", workspace.id)
        .order("created_at", { ascending: true });
      setMessages((refreshed as MessageRow[]) ?? []);
    } catch (err) {
      console.error(err);
      setError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !workspace) return;

    event.target.value = "";
    setFileError(null);
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setFileError("Files must be 5 MB or smaller.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    const storagePath = `${workspace.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setFileError(uploadError.message || "File upload failed.");
      return;
    }

    const { error: insertError } = await supabase.from("project_files").insert({
      project_id: workspace.id,
      uploaded_by: user?.id ?? null,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      storage_path: storagePath,
    });

    if (insertError) {
      await supabase.storage.from("project-files").remove([storagePath]);
      setFileError(insertError.message || "Could not save file metadata.");
      return;
    }

    await recordProjectActivity("file_uploaded", {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
    });

    const { data: refreshed } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", workspace.id)
      .order("created_at", { ascending: false });
    setFiles((refreshed as FileRow[]) ?? []);
  }

  async function handleDownload(file: FileRow) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.storage_path, 3600);

    if (error || !data?.signedUrl) {
      setError(
        error?.message || "Unable to generate a download link for this file.",
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading project workspace…
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-black">Workspace unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {error ??
              "This project cannot be accessed from your current account."}
          </p>
        </div>
      </div>
    );
  }

  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setDraft(nextValue);
    setTypingStatus(nextValue.trim() ? "You are typing…" : "No one is typing");

    void realtimeChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        sender_id: currentUserIdRef.current,
        sender_name: userName,
        isTyping: Boolean(nextValue.trim()),
      },
    });

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      setTypingStatus("No one is typing");
    }, 1400);
  };

  return (
    <main className="min-h-screen bg-[#eef3f7] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <header className="relative mb-6 overflow-hidden rounded-[1.5rem] bg-[#0b1e31] text-white shadow-lg shadow-slate-300/40">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-emerald-500/15 to-transparent" />
          <div className="relative flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <button
                type="button"
                className="mt-1 shrink-0 rounded-full border border-white/15 bg-white/10 p-2.5 text-slate-200 transition hover:bg-white/20 sm:mt-0"
                aria-label="Back"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                  Secure workspace
                </div>
                <p className="mt-1 truncate text-xs text-slate-300 sm:text-sm">
                  ProAssistNG <span className="text-slate-500">/</span> Project
                  room
                </p>
                <h1 className="mt-1 line-clamp-2 wrap-break-word text-xl font-black tracking-tight text-white sm:text-2xl lg:line-clamp-1">
                  {workspace.title}
                </h1>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              <span className="hidden text-xs font-medium text-slate-300 sm:inline">
                Project status
              </span>
              <select
                value={workspace?.status ?? "pending"}
                onChange={(e) => void updateProjectStatus(e.target.value)}
                className={`min-w-0 flex-1 cursor-pointer rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold transition sm:flex-none sm:rounded-full ${statusClass[workspace?.status as keyof typeof statusClass] ?? "bg-slate-100 text-slate-700"}`}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="revision_requested">Revision Requested</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="hidden h-10 w-px bg-white/10 lg:block" />
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 lg:flex">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Private & encrypted
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {[
            ["overview", "Overview"],
            ["messages", "Messages"],
            ["files", "Files"],
            ["activity", "Activity"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setTab(key as "overview" | "messages" | "files" | "activity")
              }
              className={
                "rounded-xl px-4 py-2 text-sm font-medium transition " +
                (tab === key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {incomingCall && callState !== "live" && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {incomingCall.metadata?.caller_name ?? "Your project partner"}{" "}
                started a{" "}
                {incomingCall.metadata?.media_type === "video"
                  ? "video"
                  : "voice"}{" "}
                call with you.
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Join when you are ready.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIncomingCall(null)}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => void answerIncomingCall(incomingCall)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
              >
                <PhoneCall className="h-4 w-4" /> Join call
              </button>
            </div>
          </div>
        )}

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-r from-emerald-50 to-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Project
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    {workspace.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={markMessagesRead}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5" />
                      {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (callState === "live") {
                        void endVoiceCall();
                        return;
                      }
                      void startVoiceCall();
                    }}
                    className={
                      "rounded-full border px-4 py-2 text-sm font-semibold transition " +
                      (callState === "live"
                        ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50")
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {callState === "live" ? (
                        <PhoneOff className="h-4 w-4" />
                      ) : (
                        <PhoneCall className="h-4 w-4" />
                      )}
                      {callState === "live"
                        ? "End call"
                        : callState === "ringing"
                          ? "Connecting…"
                          : "Start voice call"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (callState === "live") {
                        void endVoiceCall();
                        return;
                      }
                      void startVideoCall();
                    }}
                    className="rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    {callState === "live" && callMode === "video"
                      ? "End video"
                      : "Video"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <UserRound className="h-4 w-4 text-emerald-700" />
                  {workspace.freelancer_name ?? "Freelancer"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  {workspace.client_name ?? workspace.client_email ?? "Client"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  {workspace.amount
                    ? `₦${Number(workspace.amount).toLocaleString("en-NG")}`
                    : "Escrowed"}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Project description
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {workspace.description || "No description provided yet."}
                  </p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Requirements
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {workspace.requirements || "No requirements captured yet."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Voice channel
                    </p>
                    <h3 className="mt-2 text-lg font-bold">
                      {callState === "live"
                        ? "Active call"
                        : callState === "ringing"
                          ? "Connecting…"
                          : "Ready to call"}
                    </h3>
                  </div>
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
                      (callState === "live"
                        ? "bg-emerald-100 text-emerald-700"
                        : callState === "ringing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600")
                    }
                  >
                    {callState === "live"
                      ? "Live"
                      : callState === "ringing"
                        ? "Connecting"
                        : "Idle"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {callState === "live"
                        ? `Call duration: ${callDuration}s`
                        : "Microphone access enabled on demand."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (callState === "live") {
                        void endVoiceCall();
                        return;
                      }
                      void startVoiceCall();
                    }}
                    className={
                      "rounded-full px-3 py-2 text-xs font-semibold text-white " +
                      (callState === "live"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700")
                    }
                  >
                    {callState === "live"
                      ? "End"
                      : callState === "ringing"
                        ? "Connecting"
                        : "Start"}
                  </button>
                </div>

                {callError && (
                  <p className="mt-3 text-sm text-rose-600">{callError}</p>
                )}

                <audio
                  ref={audioRef}
                  autoPlay
                  muted
                  playsInline
                  className="hidden"
                />
                {callMode === "video" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
                    />
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
                    />
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Project details</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusClass[(workspace.status as keyof typeof statusClass) ?? "pending"] ?? statusClass.pending}`}
                  >
                    {displayStatus}
                  </span>
                </div>
                <dl className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Freelancer</dt>
                    <dd className="text-right font-medium">
                      {workspace.freelancer_name ?? "Freelancer"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Client</dt>
                    <dd className="text-right font-medium">
                      {workspace.client_name ??
                        workspace.client_email ??
                        "Client"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="text-right font-medium">
                      {workspace.amount
                        ? `₦${Number(workspace.amount).toLocaleString("en-NG")}`
                        : "Escrow"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Since</dt>
                    <dd className="text-right font-medium">
                      {workspace.created_at
                        ? new Date(workspace.created_at).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Deadline</dt>
                    <dd className="text-right font-medium">
                      {workspace.deadline
                        ? new Date(workspace.deadline).toLocaleDateString()
                        : "TBD"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                    {notifications.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                      No project updates yet.
                    </p>
                  ) : (
                    notifications.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                          <Inbox className="h-3.5 w-3.5" />
                          {item.type?.replace(/_/g, " ") || "Update"}
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === "messages" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold">
                <MessageSquareText className="h-4 w-4 text-emerald-700" />
                Messages
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (callState === "live") void endVoiceCall();
                    else void startVoiceCall();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  {callState === "live" ? (
                    <PhoneOff className="h-3.5 w-3.5" />
                  ) : (
                    <PhoneCall className="h-3.5 w-3.5" />
                  )}
                  {callState === "live" ? "End call" : "Call"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (callState === "live" && callMode === "video")
                      void endVoiceCall();
                    else void startVideoCall();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Video className="h-4 w-4" />
                  {callState === "live" && callMode === "video"
                    ? "End video"
                    : "Video call"}
                </button>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {safeMessages.length}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {safeMessages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                safeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_name === userName ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender_name === userName ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-80">
                        <span>{message.sender_name}</span>
                        <span>
                          {message.created_at
                            ? new Date(message.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "Now"}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>{typingStatus}</span>
              <button
                type="button"
                onClick={markMessagesRead}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark as read
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Shared files
                </p>
                <div className="space-y-2">
                  {files.slice(0, 5).map((file) => (
                    <button
                      key={`chat-file-${file.id}`}
                      type="button"
                      onClick={() => void handleDownload(file)}
                      className="flex w-full items-center gap-2 rounded-lg bg-white p-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <FileText className="h-4 w-4 text-emerald-700" />
                      <span className="truncate">{file.file_name}</span>
                      <Download className="ml-auto h-3.5 w-3.5 text-emerald-700" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <textarea
                value={draft}
                onChange={handleDraftChange}
                rows={3}
                className="w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Type a message or drop a file…"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                  <Paperclip className="h-4 w-4" />
                  Attach
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending" : "Send"}
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "files" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Shared files</h3>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white">
                <Plus className="h-3.5 w-3.5" /> Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {fileError && (
              <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {fileError}
              </p>
            )}

            <div className="space-y-3">
              {files.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No files have been uploaded yet.
                </p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {file.file_size
                            ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownload(file)}
                      className="text-emerald-700 hover:text-emerald-800"
                      aria-label={`Download ${file.file_name}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "activity" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold">Project activity</h3>
            <div className="space-y-3">
              {activity.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No activity has been recorded yet.
                </p>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border bg-slate-50 p-3"
                  >
                    <span
                      className={
                        "mt-1 h-2.5 w-2.5 rounded-full " +
                        (item.action === "message_sent"
                          ? "bg-emerald-500"
                          : item.action === "file_uploaded"
                            ? "bg-sky-500"
                            : "bg-amber-500")
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.action === "message_sent"
                          ? "Message sent"
                          : item.action === "file_uploaded"
                            ? "File uploaded"
                            : "Workspace activity"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Recently"}
                      </p>
                      {item.metadata && (
                        <p className="mt-2 text-sm text-slate-600">
                          {item.metadata.file_name ||
                            item.metadata.content ||
                            item.metadata.sender_name ||
                            "Project update"}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Status Confirmation Dialog */}
      {statusConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">
              Mark as Completed
            </h2>

            {userRole === "freelancer" ? (
              <p className="mt-3 text-sm text-slate-600">
                Are you sure you have completed this project? Once marked as
                completed, the workspace will be permanently deleted after 48
                hours.
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Are you sure{" "}
                <strong>
                  {workspace?.freelancer_name ?? "the freelancer"}
                </strong>{" "}
                has completed this project? Once marked as completed, the
                workspace will be permanently deleted after 48 hours.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setStatusConfirmation({ isOpen: false, newStatus: "" })
                }
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void performStatusUpdate("completed")}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
