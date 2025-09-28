import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

interface AudioPlayerHandle {
  play: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  ({ audioUrl, className = "" }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.error("Error playing audio:", err);
          });
          setIsPlaying(true);
        }
      },
    }));

    // Handle play/pause
    const togglePlayPause = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch((err) => {
            console.error("Error playing audio:", err);
            setError(
              "Failed to play audio. Please check if the audio file is accessible."
            );
          });
        }
        setIsPlaying(!isPlaying);
      }
    };

    // Handle stop
    const stopAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    // Fast forward 10 seconds
    const fastForward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + 10,
          duration
        );
      }
    };

    // Rewind 10 seconds
    const rewind = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(
          audioRef.current.currentTime - 10,
          0
        );
      }
    };

    // Audio event handlers
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleLoadedData = () => {
        // Check if duration is a valid finite number
        const audioDuration = audio.duration;
        console.log("LoadedData event - Audio duration:", audioDuration);
        if (isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        } else {
          // If duration is infinity or invalid, try to get it from other metadata events
          console.warn(
            "Audio duration not available in loadeddata event:",
            audioDuration
          );
        }
        setIsLoading(false);
        setError(null);
      };

      const handleLoadedMetadata = () => {
        // This event often provides more reliable duration information
        const audioDuration = audio.duration;
        console.log("LoadedMetadata event - Audio duration:", audioDuration);
        if (isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        }
      };

      const handleDurationChange = () => {
        // This event fires when the duration changes
        const audioDuration = audio.duration;
        console.log("DurationChange event - Audio duration:", audioDuration);
        if (isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
        }
      };

      const handleProgress = () => {
        // Try to get duration from buffered data
        if (audio.buffered.length > 0) {
          const audioDuration = audio.duration;
          console.log("Progress event - Audio duration:", audioDuration);
          if (isFinite(audioDuration) && audioDuration > 0) {
            setDuration(audioDuration);
          }
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = (e: ErrorEvent) => {
        console.error("Audio error:", e);
        setError(
          "Failed to load audio file. The file may be corrupted or inaccessible."
        );
        setIsLoading(false);
      };

      const handleLoadStart = () => {
        setIsLoading(true);
        setError(null);
      };

      // Add event listeners
      audio.addEventListener("loadeddata", handleLoadedData);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("durationchange", handleDurationChange);
      audio.addEventListener("progress", handleProgress);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError as EventListener);
      audio.addEventListener("loadstart", handleLoadStart);

      // Cleanup
      return () => {
        audio.removeEventListener("loadeddata", handleLoadedData);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("durationchange", handleDurationChange);
        audio.removeEventListener("progress", handleProgress);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError as EventListener);
        audio.removeEventListener("loadstart", handleLoadStart);
      };
    }, []);

    return (
      <div
        className={`max-w-md mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700 ${className}`}
      >
        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 text-red-400 bg-red-900/20 rounded-lg p-4 border border-red-800/30">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !error && (
          <div className="flex items-center justify-center gap-3 text-slate-300 py-8">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading audio...</span>
          </div>
        )}

        {/* Audio controls */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {/* Main controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={rewind}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rewind 10 seconds"
                disabled={currentTime <= 0}
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-200 shadow-lg"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} className="ml-1" />
                )}
              </button>

              <button
                onClick={stopAudio}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Stop"
                disabled={currentTime <= 0}
              >
                <Square size={18} />
              </button>

              <button
                onClick={fastForward}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fast forward 10 seconds"
                disabled={currentTime >= duration}
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default AudioPlayer;
