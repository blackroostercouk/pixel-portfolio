"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    onSpotifyIframeApiReady: ((api: SpotifyIFrameAPIShape) => void) | undefined;
    _spotifyIFrameApi: SpotifyIFrameAPIShape | undefined;
  }
}

interface SpotifyIFrameAPIShape {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: EmbedController) => void,
  ): void;
}
interface EmbedController {
  resume(): void;
  pause(): void;
  seek(positionMs: number): void;
  loadUri(uri: string): void;
  addListener(event: string, callback: (e: unknown) => void): void;
}
interface PlaybackData { isPaused: boolean; position: number; duration: number; }
interface TrackInfo { title: string; artist: string; coverUrl: string; }

function toSpotifyUri(url: string): string {
  if (url.startsWith("spotify:")) return url;
  const m = url.match(/spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : url;
}
function uriToOpenUrl(uri: string): string {
  if (uri.startsWith("spotify:")) { const [, t, id] = uri.split(":"); return `https://open.spotify.com/${t}/${id}`; }
  return uri.replace("/embed/", "/");
}
async function fetchOEmbed(openUrl: string): Promise<TrackInfo | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(openUrl)}`);
    if (!res.ok) return null;
    const j = await res.json() as { title?: string; thumbnail_url?: string };
    return { title: j.title ?? "", artist: "", coverUrl: j.thumbnail_url ?? "" };
  } catch { return null; }
}
function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const A = "/assets/spotify-player";

// ── Layout constants (px, relative to BODY_W×BODY_H) ────────────────────────
const BODY_W = 700;

const LAYOUT = {
  screen: { left: 266.5,  top: 45,      width: 286.5, height: 68.73 },
  buttons:{ left: 254,    top: 117.65,  gap: 23,      scale: 0.9 },
  volume: { left: 559,    top: 145.23,  width: 83.3,  height: 5.15, scale: 0.9 },
};

const ICON = { small: 22, play: 32, handle: 16 };


export function SpotifyPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const iframeRef   = useRef<HTMLDivElement>(null);
  const ctrlRef     = useRef<EmbedController | null>(null);
  const [pb, setPb] = useState<PlaybackData>({ isPaused: true, position: 0, duration: 0 });
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // CSS keyframes
  useEffect(() => {
    if (document.getElementById("sp3-css")) return;
    const el = document.createElement("style");
    el.id = "sp3-css";
    el.textContent = `
      .sp3-ibtn { background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center; }
      .sp3-ibtn:hover:not(:disabled) { filter:brightness(1.35) drop-shadow(0 0 5px rgba(240,180,50,.7)); }
      .sp3-ibtn:active:not(:disabled) { transform:scale(.9); }
      .sp3-ibtn:disabled { opacity:.3; cursor:default; }
    `;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  // Spotify API
  useEffect(() => {
    const uri = toSpotifyUri(url);
    void fetchOEmbed(uriToOpenUrl(uri)).then(info => { if (info) setTrack(info); });

    const init = (api: SpotifyIFrameAPIShape) => {
      window._spotifyIFrameApi = api;
      if (!iframeRef.current) return;
      api.createController(iframeRef.current, { uri, width: "300", height: "80" }, ctrl => {
        ctrlRef.current = ctrl;
        ctrl.addListener("ready", () => { setReady(true); ctrl.resume(); });
        ctrl.addListener("playback_update", (raw) => {
          const e = raw as Record<string, unknown>;
          const d = (e.data ?? e.payload ?? e) as Record<string, unknown>;
          setPb({ isPaused: Boolean(d.isPaused ?? true), position: Number(d.position ?? 0), duration: Number(d.duration ?? d.trackDuration ?? 0) });
          type Ent = { name?: string; type?: string; images?: { url: string }[] };
          const ents = d.entities as Ent[] | undefined;
          if (ents?.length) {
            const te = ents.find(e => e.type === "track") ?? ents[0];
            const ae = ents.find(e => e.type === "artist");
            setTrack(p => ({ title: te?.name ?? p?.title ?? "", artist: ae?.name ?? ents[1]?.name ?? p?.artist ?? "", coverUrl: te?.images?.[0]?.url ?? p?.coverUrl ?? "" }));
          }
        });
      });
    };

    if (window._spotifyIFrameApi) init(window._spotifyIFrameApi);
    else {
      window.onSpotifyIframeApiReady = init;
      if (!document.getElementById("spotify-iframe-api")) {
        const s = document.createElement("script");
        s.id = "spotify-iframe-api"; s.src = "https://open.spotify.com/embed/iframe-api/v1"; s.async = true;
        document.head.appendChild(s);
      }
    }
    return () => { ctrlRef.current = null; setReady(false); setTrack(null); setPb({ isPaused: true, position: 0, duration: 0 }); };
  }, [url]);

  const togglePlay = useCallback(() => {
    const c = ctrlRef.current; if (!c) return;
    pb.isPaused ? c.resume() : c.pause();
  }, [pb.isPaused]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const c = ctrlRef.current; if (!c || !pb.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    c.seek(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * pb.duration));
  }, [pb.duration]);

  const handleVolClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  }, []);

  const progress = pb.duration > 0 ? pb.position / pb.duration : 0;

  const buttons = [
    { icon: "icon-shuffle.png", label: "Shuffle",  size: ICON.small, onClick: () => {},  disabled: false },
    { icon: "icon-prev.png",    label: "Previous", size: ICON.small, onClick: () => {},  disabled: false },
    { icon: pb.isPaused ? "icon-play.png" : "icon-pause.png", label: pb.isPaused ? "Play" : "Pause", size: ICON.play, onClick: togglePlay, disabled: !ready },
    { icon: "icon-next.png",    label: "Next",     size: ICON.small, onClick: () => {},  disabled: false },
    { icon: "icon-repeat.png",  label: "Repeat",   size: ICON.small, onClick: () => {},  disabled: false },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 20, pointerEvents: "none" }}>

      {/* Hidden Spotify iframe — clipped to 0×0 */}
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        <div ref={iframeRef} style={{ width: 300, height: 80 }} />
      </div>

      {/* Player */}
      <div style={{ pointerEvents: "all", position: "relative", width: BODY_W, fontFamily: "var(--font-pixel, monospace)", transform: "scale(0.85)", transformOrigin: "bottom center" }}>

        {/* Close */}
        <button
          type="button" onClick={onClose} aria-label="Close"
          style={{ position: "absolute", top: 6, right: 6, zIndex: 20, background: "rgba(8,6,2,.88)", border: "1px solid #4a3418", borderRadius: 3, width: 20, height: 20, cursor: "pointer", color: "#b08030", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}
        >✕</button>

        {/* Body image */}
        <img src={`${A}/player_body.png`} alt="" style={{ width: "100%", display: "block" }} />

        {/* ── Screen content overlay ── */}
        <div style={{ position: "absolute", left: LAYOUT.screen.left, top: LAYOUT.screen.top, width: LAYOUT.screen.width, height: LAYOUT.screen.height, display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", boxSizing: "border-box", overflow: "hidden" }}>
          {track?.coverUrl && (
            <img src={track.coverUrl} alt="" style={{ flexShrink: 0, width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid #4a3418" }} />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#f0b830", fontSize: 10, fontWeight: "bold", letterSpacing: 0.8, textShadow: "0 0 10px rgba(240,184,48,.85)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {track?.title ? track.title.toUpperCase() : ready ? "LOADING..." : "CONNECTING..."}
            </div>
            {track?.artist && (
              <div style={{ color: "#a07030", fontSize: 7.5, marginTop: 2, letterSpacing: 0.4, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {track.artist.toUpperCase()}
              </div>
            )}
            {pb.duration > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 4, color: "#f0b830", fontSize: 7, letterSpacing: 0.3, fontVariantNumeric: "tabular-nums" }}>
                <span>{fmtMs(pb.position)}</span>
                <span style={{ color: "#a07030" }}>/</span>
                <span style={{ color: "#a07030" }}>{fmtMs(pb.duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Button container (flex row) ── */}
        <div style={{ position: "absolute", left: LAYOUT.buttons.left, top: LAYOUT.buttons.top, display: "flex", alignItems: "center", gap: LAYOUT.buttons.gap, transform: `scale(${LAYOUT.buttons.scale})` }}>
          {buttons.map(({ icon, label, size, onClick, disabled }) => (
            <button key={label} type="button" onClick={onClick} disabled={disabled} aria-label={label} className="sp3-ibtn" style={{ width: size * 1.6, height: size * 1.6 }}>
              <img src={`${A}/${icon}`} alt={label} style={{ width: size, height: size, imageRendering: "pixelated", display: "block" }} />
            </button>
          ))}
        </div>

        {/* ── Volume overlay ── */}
        <div onClick={handleVolClick} style={{ position: "absolute", left: LAYOUT.volume.left, top: LAYOUT.volume.top, width: LAYOUT.volume.width, height: LAYOUT.volume.height, cursor: "pointer", transform: `scale(${LAYOUT.volume.scale})` }}>
          <div style={{ position: "absolute", inset: 0, background: "#120e04", borderRadius: 2 }} />
          <div style={{ position: "relative", height: "100%", width: `${volume * 100}%`, background: "linear-gradient(90deg,#a06010,#f0b830)", borderRadius: 2, boxShadow: "0 0 4px rgba(240,184,48,.5)" }}>
            <img src={`${A}/handle-gold.png`} alt="" style={{ position: "absolute", right: -ICON.handle / 2, top: "50%", transform: "translateY(-50%)", width: ICON.handle, height: ICON.handle, pointerEvents: "none" }} />
          </div>
        </div>

      </div>
    </div>
  );
}
