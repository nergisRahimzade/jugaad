"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "audio/webm";
}

function microphoneErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "Microphone blocked. In the address bar click the lock/site icon → allow Microphone → reload this page. On Mac: System Settings → Privacy & Security → Microphone → enable your browser.";
      case "NotFoundError":
        return "No microphone detected. Plug one in or enable it in System Settings → Privacy & Security → Microphone.";
      case "NotReadableError":
        return "Microphone is busy (Zoom, FaceTime, etc.). Close other apps using the mic and try again.";
      case "SecurityError":
        return "Microphone requires a secure page. Open http://localhost:3001 in Chrome or Safari — not a network IP and not the Cursor preview panel.";
      case "NotSupportedError":
        return "Recording isn't supported in this browser. Use Chrome or Safari at http://localhost:3001.";
      default:
        return err.message || "Could not access the microphone.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Could not access the microphone.";
}

export function useSpeechToText() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const listeningRef = useRef(false);
  const transcribingRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    if (listeningRef.current || transcribingRef.current) return;

    setError(null);
    setTranscript("");
    chunksRef.current = [];

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "Microphone only works on https:// or http://localhost. Open http://localhost:3001 in Chrome or Safari."
      );
      return;
    }

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Your browser doesn't support voice recording. Use Chrome or Safari at http://localhost:3001.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
      listeningRef.current = true;
      setListening(true);
    } catch (err) {
      stopStream();
      listeningRef.current = false;
      setListening(false);
      setError(microphoneErrorMessage(err));
    }
  }, [stopStream]);

  const stopListening = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      listeningRef.current = false;
      setListening(false);
      return transcript;
    }

    listeningRef.current = false;
    setListening(false);
    transcribingRef.current = true;
    setTranscribing(true);

    const mimeType = recorder.mimeType || getSupportedMimeType();
    let stopError: string | null = null;

    const blob = await new Promise<Blob>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error("Recording timed out. Tap the mic to try again."));
      }, 8000);

      recorder.onstop = () => {
        window.clearTimeout(timeout);
        resolve(new Blob(chunksRef.current, { type: mimeType }));
      };

      try {
        if (recorder.state === "recording") {
          recorder.requestData();
        }
        recorder.stop();
      } catch (err) {
        window.clearTimeout(timeout);
        reject(err instanceof Error ? err : new Error("Could not stop recording."));
      }

      stopStream();
      recorderRef.current = null;
    }).catch((err) => {
      stopError = err instanceof Error ? err.message : "Could not stop recording.";
      return new Blob([], { type: mimeType });
    });

    if (blob.size === 0) {
      transcribingRef.current = false;
      setTranscribing(false);
      setError(stopError ?? "No audio captured. Speak for at least a second, then tap the mic again to stop.");
      return "";
    }

    try {
      const text = await api.transcribeAudio(blob);
      setTranscript(text);
      return text;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transcription failed. Please try again.";
      setError(message);
      return "";
    } finally {
      transcribingRef.current = false;
      setTranscribing(false);
    }
  }, [stopStream, transcript]);

  const toggleListening = useCallback(async (): Promise<string> => {
    if (listeningRef.current) {
      return stopListening();
    }
    await startListening();
    return "";
  }, [startListening, stopListening]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Best-effort cleanup when navigating away.
        }
      }
      stopStream();
      recorderRef.current = null;
      listeningRef.current = false;
      transcribingRef.current = false;
    };
  }, [stopStream]);

  return {
    listening,
    transcribing,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    setTranscript,
    setError,
  };
}
