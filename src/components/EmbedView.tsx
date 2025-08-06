import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StreamPlayer } from './StreamPlayer';
import { Stream } from '../types/stream';

export const EmbedView: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const [stream, setStream] = useState<Stream | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    setAutoplay(urlParams.get('autoplay') === '1');
    setShowControls(urlParams.get('controls') !== '0');

    if (streamId) {
      const savedStreams = localStorage.getItem('streams');
      if (savedStreams) {
        const allStreams = JSON.parse(savedStreams);
        const foundStream = allStreams.find((s: Stream) => s.id === streamId);
        setStream(foundStream || null);
      }
    }
  }, [streamId]);

  if (!stream) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg mb-2">Stream not found</div>
          <div className="text-sm text-slate-400">The requested stream is not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <StreamPlayer
        hlsUrl={stream.hlsUrl}
        dashUrl={stream.dashUrl}
        streamName={stream.name}
        status={stream.status}
      />
      
      {/* Minimal overlay with stream info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="font-medium">{stream.name}</div>
            <div className="text-xs text-slate-300">
              {stream.outputFormat} • {stream.quality}
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Powered by Stream Manager
          </div>
        </div>
      </div>
    </div>
  );
};