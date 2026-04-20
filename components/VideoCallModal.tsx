"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

interface Props {
  callType: "video" | "voice";
  targetUser: { _id: string; name: string; image?: string };
  myId: string;
  myName: string;
  myImage?: string;
  isIncoming?: boolean;
  offer?: RTCSessionDescriptionInit;
  onEnd: () => void;
}

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

export default function VideoCallModal({ callType, targetUser, myId, myName, myImage, isIncoming, offer, onEnd }: Props) {
  const [callState, setCallState] = useState<"connecting" | "ringing" | "active" | "ended">(isIncoming ? "ringing" : "connecting");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const socket = getSocket();

  useEffect(() => {
    if (isIncoming) return; // Caller sets up first
    initCall();

    socket.on("call_answered", async ({ answer }: any) => {
      try {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState("active");
        startTimer();
      } catch {}
    });

    socket.on("ice_candidate", async ({ candidate }: any) => {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });

    socket.on("call_rejected", () => { setCallState("ended"); setTimeout(onEnd, 1500); });
    socket.on("call_ended", () => { setCallState("ended"); setTimeout(onEnd, 1500); });

    return () => {
      socket.off("call_answered"); socket.off("ice_candidate");
      socket.off("call_rejected"); socket.off("call_ended");
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isIncoming) return;

    socket.on("ice_candidate", async ({ candidate }: any) => {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });
    socket.on("call_ended", () => { setCallState("ended"); setTimeout(onEnd, 1500); });

    return () => { socket.off("ice_candidate"); socket.off("call_ended"); cleanup(); };
  }, []);

  const initCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice_candidate", { targetId: targetUser._id, candidate: e.candidate });
      };

      const offerSDP = await pc.createOffer();
      await pc.setLocalDescription(offerSDP);

      socket.emit("call_user", {
        callerId: myId, callerName: myName, callerImage: myImage,
        receiverId: targetUser._id, callType, offer: offerSDP,
      });
    } catch (err) {
      console.error("initCall error:", err);
      setCallState("ended");
      setTimeout(onEnd, 1500);
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice_candidate", { targetId: targetUser._id, candidate: e.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer!));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call_answer", { callerId: targetUser._id, answer });
      setCallState("active");
      startTimer();
    } catch (err) {
      console.error("answerCall error:", err);
    }
  };

  const rejectCall = () => {
    socket.emit("reject_call", { callerId: targetUser._id });
    setCallState("ended");
    setTimeout(onEnd, 500);
  };

  const endCall = () => {
    socket.emit("end_call", { targetId: targetUser._id });
    setCallState("ended");
    setTimeout(onEnd, 500);
    cleanup();
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff(!cameraOff);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center animate-fade-in">
      {/* Remote video */}
      {callType === "video" && (
        <video ref={remoteVideoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Local video (PiP) */}
      {callType === "video" && (
        <video ref={localVideoRef} autoPlay playsInline muted
          className="absolute top-4 right-4 w-28 h-40 object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-10" />
      )}

      {/* Info */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
        {targetUser.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={targetUser.image} alt={targetUser.name}
            className={`rounded-full object-cover border-4 border-white/20 ${callType === "video" && callState === "active" ? "hidden" : "w-24 h-24"}`} />
        ) : (
          <div className={`rounded-full bg-brand-500/30 flex items-center justify-center text-4xl font-bold text-white ${callType === "video" && callState === "active" ? "hidden" : "w-24 h-24"}`}>
            {targetUser.name[0]}
          </div>
        )}
        <h2 className="text-white text-2xl font-semibold">{targetUser.name}</h2>
        <p className="text-gray-300 text-sm">
          {callState === "connecting" ? `Calling… ${callType === "video" ? "📹" : "📞"}` :
           callState === "ringing"    ? "Incoming call…" :
           callState === "active"     ? formatDuration(duration) :
           "Call ended"}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-5">
        {callState === "ringing" ? (
          <>
            {/* Reject */}
            <button onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all active:scale-95">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a16 16 0 0116 16" />
              </svg>
            </button>
            {/* Answer */}
            <button onClick={answerCall}
              className="w-16 h-16 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-xl transition-all active:scale-95 animate-pulse">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {/* Mute */}
            <button onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${muted ? "bg-white text-gray-900" : "bg-white/20 text-white hover:bg-white/30"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {muted
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />}
              </svg>
            </button>

            {/* Camera (video only) */}
            {callType === "video" && (
              <button onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${cameraOff ? "bg-white text-gray-900" : "bg-white/20 text-white hover:bg-white/30"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            {/* End call */}
            <button onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all active:scale-95">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a16 16 0 0116 16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
