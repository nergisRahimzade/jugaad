"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "./api";

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "audio/webm";
}

export function useSpeechToText() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    if (listening || transcribing) return;

    setError(null);
    setTranscript("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
      setListening(true);
    } catch {
      stopStream();
      setError("Microphone access denied. Check your browser permissions.");
    }
  }, [listening, transcribing, stopStream]);

  const stopListening = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return transcript;
    }

    setListening(false);
    setTranscribing(true);

    const mimeType = recorder.mimeType || getSupportedMimeType();

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: mimeType }));
      };
      recorder.stop();
      stopStream();
      recorderRef.current = null;
    });

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
      setTranscribing(false);
    }
  }, [stopStream, transcript]);

  const toggleListening = useCallback(async (): Promise<string> => {
    if (listening) {
      return stopListening();
    }
    await startListening();
    return "";
  }, [listening, startListening, stopListening]);

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
