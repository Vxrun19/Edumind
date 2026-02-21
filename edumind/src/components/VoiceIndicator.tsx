"use client";

interface VoiceIndicatorProps {
  isListening: boolean;
  onStop: () => void;
}

export default function VoiceIndicator({
  isListening,
  onStop,
}: VoiceIndicatorProps) {
  if (!isListening) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
      <button
        onClick={onStop}
        className="flex items-center gap-3 bg-red-500 text-white pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-red-500/25 hover:bg-red-600 transition-colors"
      >
        {/* Pulsing red dot */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>

        <span className="text-sm font-medium">Listening...</span>

        {/* Sound wave bars */}
        <div className="flex items-center gap-[3px] h-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="voice-wave-bar w-[3px] rounded-full bg-[var(--accent)]"
              style={{
                animationDelay: `${i * 0.12}s`,
                height: "100%",
              }}
            />
          ))}
        </div>

        <span className="text-xs opacity-75 ml-1">tap to stop</span>
      </button>
    </div>
  );
}
