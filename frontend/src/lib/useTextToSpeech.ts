"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

/**
 * Plays back assistant responses as voice using Deepgram Aura TTS.
 * Mirrors useSpeechToText: one toggle of state, imperative speak/stop.
 */
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setSpeaking(false);
  }, [cleanup]);

  const speak = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Cancel any in-flight playback before starting the next one.
      cleanup();
      setError(null);
      setSynthesizing(true);

      try {
        const blob = await api.synthesizeSpeech(trimmed);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          cleanup();
        };
        audio.onerror = () => {
          setSpeaking(false);
          setError("Couldn't play the spoken response.");
          cleanup();
        };

        setSpeaking(true);
        await audio.play();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Voice playback failed.";
        setError(message);
        setSpeaking(false);
        cleanup();
      } finally {
        setSynthesizing(false);
      }
    },
    [cleanup]
  );

  // Tear down audio if the component unmounts mid-playback.
  useEffect(() => cleanup, [cleanup]);

  return { speaking, synthesizing, error, speak, stop };
}
