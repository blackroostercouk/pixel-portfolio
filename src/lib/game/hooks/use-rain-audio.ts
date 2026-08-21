"use client";

import { useEffect, useRef } from "react";
import { clampAudioVolume } from "@/lib/game/layout-utils";

export function useRainAudio(isRainEnabled: boolean) {
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasUnlockedAudioRef = useRef(false);
  const rainAudioFadeFrameRef = useRef<number | null>(null);

  const fadeRainAudioTo = (targetVolume: number, durationMs: number) => {
    const audio = rainAudioRef.current;
    if (!audio) return;

    if (rainAudioFadeFrameRef.current !== null) {
      window.cancelAnimationFrame(rainAudioFadeFrameRef.current);
      rainAudioFadeFrameRef.current = null;
    }

    const startVolume = audio.volume;
    const startedAt = window.performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);

      audio.volume = clampAudioVolume(startVolume + (targetVolume - startVolume) * eased);

      if (progress < 1) {
        rainAudioFadeFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      rainAudioFadeFrameRef.current = null;

      if (targetVolume <= 0.001) {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    rainAudioFadeFrameRef.current = window.requestAnimationFrame(tick);
  };

  const syncRainAudio = (rainEnabled: boolean) => {
    const audio = rainAudioRef.current;
    if (!audio || !hasUnlockedAudioRef.current) return;

    if (!rainEnabled) {
      fadeRainAudioTo(0, 320);
      return;
    }

    if (audio.paused) {
      audio.volume = clampAudioVolume(0);
      void audio
        .play()
        .then(() => {
          fadeRainAudioTo(0.42, 900);
        })
        .catch(() => {
          // Ignore transient autoplay failures; later events retry.
        });
      return;
    }

    fadeRainAudioTo(0.42, 500);
  };

  useEffect(() => {
    const audio = new Audio("/assets/audio/music/rain.m4a");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.load();
    rainAudioRef.current = audio;

    const handleCanPlay = () => syncRainAudio(isRainEnabled);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("loadeddata", handleCanPlay);

    return () => {
      if (rainAudioFadeFrameRef.current !== null) {
        window.cancelAnimationFrame(rainAudioFadeFrameRef.current);
        rainAudioFadeFrameRef.current = null;
      }
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("loadeddata", handleCanPlay);
      audio.pause();
      audio.currentTime = 0;
      rainAudioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      hasUnlockedAudioRef.current = true;
      syncRainAudio(isRainEnabled);
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [isRainEnabled]);

  useEffect(() => {
    syncRainAudio(isRainEnabled);
  }, [isRainEnabled]);
}
