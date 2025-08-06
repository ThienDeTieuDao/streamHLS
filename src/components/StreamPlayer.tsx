import React, { useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface StreamPlayerProps {
  hlsUrl?: string;
  dashUrl?: string;
  streamName: string;
  status: string;
}

export const StreamPlayer: React.FC<StreamPlayerProps> = ({ hlsUrl, dashUrl, streamName, status }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isBuffering, setIsBuffering] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastRetry, setLastRetry] = React.useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== 'active') return;

    // Try to load HLS first, then DASH
    const streamUrl = hlsUrl || dashUrl;
    if (streamUrl) {
      video.src = streamUrl;
      video.load();
      setConnectionStatus('reconnecting');
      setRetryCount(0);
    }
  }, [hlsUrl, dashUrl, status]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsBuffering(true);
      setConnectionStatus('reconnecting');
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
      setConnectionStatus('connected');
      setError(null);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      setIsBuffering(false);
      setConnectionStatus('disconnected');
      
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            setError('Network error - Check if OBS is streaming to RTMP endpoint');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError('Stream format error - FFmpeg conversion may be in progress');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('Stream not supported - HLS/DASH conversion required');
            break;
          default:
            setError('Playback error - Stream conversion may not be ready');
        }
        
        // Auto-retry logic
        const now = Date.now();
        if (retryCount < 5 && now - lastRetry > 5000) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setLastRetry(now);
            const video = videoRef.current;
            if (video) {
              video.load();
              setConnectionStatus('reconnecting');
            }
          }, 3000);
        }
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  const manualRetry = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setError(null);
    setConnectionStatus('reconnecting');
    setRetryCount(0);
    video.load();
  };
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Failed to play stream - Check OBS streaming status');
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  if (status !== 'active') {
    return (
      <div className="bg-slate-900/50 rounded-lg aspect-video flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {status === 'processing' ? 'Converting RTMP to HLS/DASH via FFmpeg...' : 'Stream not ready for preview'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            RTMP → HLS/DASH conversion in progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video group">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
      />
      
      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
          connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-3 h-3" />
              LIVE
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Connecting
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </div>
      </div>

      {/* Buffering Indicator */}
      {isBuffering && !error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-white">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Buffering...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm">{error}</p>
            <div className="mt-3 space-y-2">
              <p className="text-slate-400 text-xs">
                Retry {retryCount}/5 • Check OBS streaming status
              </p>
              <button
                onClick={manualRetry}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
            
            <span className="text-white text-sm font-medium">{streamName}</span>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <Maximize className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};