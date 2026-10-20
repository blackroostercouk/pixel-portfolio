"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          host?: string;
          width?: number;
          height?: number;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  mute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

function extractVideoId(url: string): string {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ??
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ??
    url.match(/embed\/([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? url;
}

function fmtSec(s: number): string {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

// Frame image: 1672×941px — transparent center hole
// Measured inner area percentages:
const INNER = { left: "13.25%", top: "7.8%", width: "75.5%", height: "80%" };

// Player display size (like Spotify player — bottom of screen)
const PLAYER_W = 650;
const PLAYER_H = Math.round(PLAYER_W * (941 / 1672)); // ≈ 366px

export function YouTubePlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<YTPlayer | null>(null);
  const tickRef      = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [ready,        setReady]        = useState(false);
  const [started,      setStarted]      = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [position,     setPosition]     = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoId = extractVideoId(url);

  const startTick = useCallback(() => {
    if (tickRef.current !== null) return;
    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      setPosition(p.getCurrentTime());
      setDuration(p.getDuration());
      tickRef.current = window.requestAnimationFrame(tick);
    };
    tickRef.current = window.requestAnimationFrame(tick);
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current !== null) { cancelAnimationFrame(tickRef.current); tickRef.current = null; }
  }, []);

  useEffect(() => {
    let destroyed = false;

    const initPlayer = () => {
      if (!containerRef.current || destroyed) return;
      new window.YT.Player(containerRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, playsinline: 1, mute: 1, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            playerRef.current = e.target;
            e.target.mute();
            setDuration(e.target.getDuration());
            setReady(true);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (destroyed) return;
            const S = window.YT?.PlayerState;
            if (!S) return;
            if (e.data === S.PLAYING) { setPlaying(true); setStarted(true); startTick(); }
            else { setPlaying(false); stopTick(); }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api"; s.src = "https://www.youtube.com/iframe_api"; s.async = true;
        document.head.appendChild(s);
      }
    }

    return () => {
      destroyed = true;
      stopTick();
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
      setReady(false); setStarted(false); setPlaying(false); setPosition(0); setDuration(0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    playing ? p.pauseVideo() : p.playVideo();
  }, [playing]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current; if (!p || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    p.seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration, true);
  }, [duration]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 2500);
  }, []);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (hideTimerRef.current !== null) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    }
  }, [playing]);

  const progress = duration > 0 ? position / duration : 0;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 16, pointerEvents: "none" }}>
      <div
        style={{ pointerEvents: "all", position: "relative", width: PLAYER_W, height: PLAYER_H, transform: "scale(0.85)", transformOrigin: "bottom center" }}
      >
        {/* ── 1. VIDEO — below frame (z-index 1) ── */}
        <div style={{ position: "absolute", left: INNER.left, top: INNER.top, width: INNER.width, height: INNER.height, zIndex: 1, background: "#000", overflow: "hidden" }}
          onMouseMove={revealControls}
          onMouseLeave={() => { if (playing) setShowControls(false); }}
        >
          {/* YouTube iframe fills inner area */}
          <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

          {/* Loading — stays until first PLAYING to hide YouTube branding screen */}
          {!started && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0602", color: "#f0b830", fontSize: 9, letterSpacing: 2, fontFamily: "var(--font-pixel, monospace)", zIndex: 5 }}>
              {ready ? "LOADING..." : "CONNECTING..."}
            </div>
          )}


          {/* Controls overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", transition: "opacity 0.3s", opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
            {/* Center play/pause */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button type="button" onClick={togglePlay} disabled={!ready} aria-label={playing ? "Pause" : "Play"}
                style={{ background: "rgba(0,0,0,0.55)", border: "2px solid rgba(240,184,48,0.7)", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0b830", fontSize: 16 }}
              >
                {playing ? "⏸" : "▶"}
              </button>
            </div>

            {/* Bottom: seek + time */}
            <div style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.75))", padding: "20px 8px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div onClick={handleSeek} style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, cursor: "pointer", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg,#a06010,#f0b830)", borderRadius: 2 }} />
              </div>
              {duration > 0 && (
                <div style={{ color: "rgba(240,184,48,0.85)", fontSize: 7, fontFamily: "var(--font-pixel, monospace)", letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
                  {fmtSec(position)} / {fmtSec(duration)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. FRAME — above video (z-index 2) ── */}
        <img
          src="/assets/youtube-player/frame.webp"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 2, pointerEvents: "none", userSelect: "none" }}
        />

        {/* ── 3. Close button — above frame (z-index 3) ── */}
        <button type="button" onClick={onClose} aria-label="Close"
          style={{ position: "absolute", top: 6, right: 6, zIndex: 3, background: "rgba(8,6,2,.88)", border: "1px solid #4a3418", borderRadius: 3, width: 20, height: 20, cursor: "pointer", color: "#b08030", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}
        >✕</button>
      </div>
    </div>
  );
}
