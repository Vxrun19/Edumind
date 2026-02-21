"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────
export type VoiceSpeed = "slow" | "normal" | "fast";

export interface VoiceSettings {
  speed: VoiceSpeed;
  voiceURI: string; // selected SpeechSynthesisVoice URI
  voiceOutputEnabled: boolean;
}

export interface UseVoiceReturn {
  // Speech Recognition (input)
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speechSupported: boolean;
  micError: string | null;

  // Speech Synthesis (output)
  isSpeaking: boolean;
  speakingMessageIndex: number | null;
  speak: (text: string, messageIndex: number) => void;
  stopSpeaking: () => void;
  synthSupported: boolean;

  // Voice output toggle
  voiceOutputEnabled: boolean;
  toggleVoiceOutput: () => void;

  // Settings
  voiceSettings: VoiceSettings;
  setSpeed: (speed: VoiceSpeed) => void;
  setVoiceURI: (uri: string) => void;
  availableVoices: SpeechSynthesisVoice[];
}

// ─── Constants ────────────────────────────────────────────
const STORAGE_KEY = "edumind-voice-settings";
const SPEED_MAP: Record<VoiceSpeed, number> = {
  slow: 0.75,
  normal: 1.0,
  fast: 1.4,
};

// ─── Helpers ──────────────────────────────────────────────
function getDefaultSettings(): VoiceSettings {
  return {
    speed: "normal",
    voiceURI: "",
    voiceOutputEnabled: false,
  };
}

function loadSettings(): VoiceSettings {
  if (typeof window === "undefined") return getDefaultSettings();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultSettings();
}

function saveSettings(settings: VoiceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Web Speech API types (not in default TS lib)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionConstructor = any;

// Cross-browser SpeechRecognition constructor
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ─── Hook ─────────────────────────────────────────────────
export function useVoice(): UseVoiceReturn {
  const [settings, setSettings] = useState<VoiceSettings>(getDefaultSettings);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [synthSupported, setSynthSupported] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ─── Load settings from localStorage on mount ──────────
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  // ─── Check browser support on mount ────────────────────
  useEffect(() => {
    const SR = getSpeechRecognition();
    setSpeechSupported(!!SR);
    setSynthSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // ─── Load available voices ─────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      // Filter to English voices and sort by quality
      const englishVoices = voices.filter(
        (v) => v.lang.startsWith("en")
      );
      // Prefer non-remote voices (local = lower latency)
      englishVoices.sort((a, b) => {
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;
        return 0;
      });
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // ─── Settings updaters ─────────────────────────────────
  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const setSpeed = useCallback(
    (speed: VoiceSpeed) => updateSettings({ speed }),
    [updateSettings]
  );

  const setVoiceURI = useCallback(
    (voiceURI: string) => updateSettings({ voiceURI }),
    [updateSettings]
  );

  const toggleVoiceOutput = useCallback(() => {
    updateSettings({ voiceOutputEnabled: !settingsRef.current.voiceOutputEnabled });
  }, [updateSettings]);

  // ─── Speech Recognition ────────────────────────────────
  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setMicError("Voice input not supported in this browser. Try Chrome.");
      return;
    }

    // Clear previous error
    setMicError(null);
    setTranscript("");

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setMicError("Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        // Silence timeout — not really an error for us
        setMicError(null);
      } else if (event.error === "aborted") {
        // User cancelled — not an error
        setMicError(null);
      } else {
        setMicError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setMicError("Could not start voice recognition. Please try again.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ─── Speech Synthesis ──────────────────────────────────
  const speak = useCallback(
    (text: string, messageIndex: number) => {
      if (!synthSupported) return;

      // Stop any current speech
      window.speechSynthesis.cancel();

      // Clean text for speech: remove markdown, code blocks, etc.
      const cleaned = text
        .replace(/```[\s\S]*?```/g, " code block ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~`#]/g, "")
        .replace(/\n{2,}/g, ". ")
        .replace(/\n/g, " ")
        .trim();

      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = SPEED_MAP[settingsRef.current.speed];
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Find the selected voice
      if (settingsRef.current.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find(
          (v) => v.voiceURI === settingsRef.current.voiceURI
        );
        if (selected) utterance.voice = selected;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageIndex(messageIndex);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [synthSupported]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
  }, []);

  // ─── Cleanup on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    speechSupported,
    micError,

    isSpeaking,
    speakingMessageIndex,
    speak,
    stopSpeaking,
    synthSupported,

    voiceOutputEnabled: settings.voiceOutputEnabled,
    toggleVoiceOutput,

    voiceSettings: settings,
    setSpeed,
    setVoiceURI,
    availableVoices,
  };
}
