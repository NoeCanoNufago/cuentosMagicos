import { useState, useEffect, useRef } from 'react';
import { HiPlay, HiPause, HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';

declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const YouTubePlayer = ({ videoId, volume, onVolumeChange }: YouTubePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Función para cargar la API de YouTube
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    };

    // Función para inicializar el reproductor
    const initPlayer = () => {
      if (containerRef.current && window.YT) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '200',
          width: '100%',
          videoId: videoId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0
          },
          events: {
            onReady: () => {
              setIsReady(true);
              if (playerRef.current?.setVolume) {
                playerRef.current.setVolume(volume * 100);
              }
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
      }
    };

    // Si la API ya está cargada, inicializar el reproductor
    if (window.YT) {
      initPlayer();
    } else {
      // Si no está cargada, configurar el callback y cargar la API
      window.onYouTubeIframeAPIReady = initPlayer;
      loadYouTubeAPI();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (isReady && playerRef.current?.setVolume) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume, isReady]);

  const togglePlay = () => {
    if (!isReady || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange(newVolume);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="aspect-video bg-slate-100 dark:bg-slate-900">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between gap-6">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-200 transform ${
              isReady
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            {isPlaying ? (
              <HiPause className="w-7 h-7" />
            ) : (
              <HiPlay className="w-7 h-7" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-4">
            <button
              onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              {volume === 0 ? (
                <HiSpeakerXMark className="w-6 h-6" />
              ) : (
                <HiSpeakerWave className="w-6 h-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-blue-600"
            />
            <span className="w-12 text-center font-mono text-sm font-medium text-slate-600 dark:text-slate-400">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 