import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, AlertCircle, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time from seconds to MM:SS format
  const formatTime = (time: number): string => {
    if (!isFinite(time) || time <= 0) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio. Please check if the audio file is accessible.');
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

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  // Fast forward 10 seconds
  const fastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  // Rewind 10 seconds
  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      // Check if duration is a valid finite number
      const audioDuration = audio.duration;
      console.log('LoadedData event - Audio duration:', audioDuration);
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      } else {
        // If duration is infinity or invalid, try to get it from other metadata events
        console.warn('Audio duration not available in loadeddata event:', audioDuration);
      }
      setIsLoading(false);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      // This event often provides more reliable duration information
      const audioDuration = audio.duration;
      console.log('LoadedMetadata event - Audio duration:', audioDuration);
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    };

    const handleDurationChange = () => {
      // This event fires when the duration changes
      const audioDuration = audio.duration;
      console.log('DurationChange event - Audio duration:', audioDuration);
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    };

    const handleProgress = () => {
      // Try to get duration from buffered data
      if (audio.buffered.length > 0) {
        const audioDuration = audio.duration;
        console.log('Progress event - Audio duration:', audioDuration);
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
      console.error('Audio error:', e);
      setError('Failed to load audio file. The file may be corrupted or inaccessible.');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('loadstart', handleLoadStart);

    // Cleanup
    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  return (
    <div className={`max-w-md mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
      
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
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
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
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={duration <= 0}
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Volume control */}
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
              }}
            />
            <span className="text-xs text-slate-400 min-w-8">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
