import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StreamPlayer } from './StreamPlayer';
import { Stream } from '../types/stream';
import { ArrowLeft, Copy, Settings, Code, ExternalLink, Share2, Monitor, Smartphone, Tablet } from 'lucide-react';

export const StreamView: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [stream, setStream] = useState<Stream | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedSize, setEmbedSize] = useState({ width: 854, height: 480 });
  const [autoplay, setAutoplay] = useState(false);
  const [controls, setControls] = useState(true);

  useEffect(() => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Stream not found</div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/${stream.id}`;
    
    return `<iframe 
  src="${embedUrl}${autoplay ? '?autoplay=1' : ''}${!controls ? (autoplay ? '&' : '?') + 'controls=0' : ''}"
  width="${embedSize.width}" 
  height="${embedSize.height}"
  frameborder="0" 
  allowfullscreen
  allow="autoplay; fullscreen">
</iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
  };

  const copyStreamUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const presetSizes = [
    { name: 'Small', width: 560, height: 315, icon: Smartphone },
    { name: 'Medium', width: 854, height: 480, icon: Tablet },
    { name: 'Large', width: 1280, height: 720, icon: Monitor }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{stream.name}</h1>
                <p className="text-sm text-slate-400">Live Stream View</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={copyStreamUrl}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setShowEmbedCode(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
              >
                <Code className="w-4 h-4" />
                Embed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
              <StreamPlayer
                hlsUrl={stream.hlsUrl}
                dashUrl={stream.dashUrl}
                streamName={stream.name}
                status={stream.status}
              />
            </div>
            
            {/* Stream Info */}
            <div className="mt-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Stream Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Format</p>
                  <p className="text-white font-medium">{stream.outputFormat}</p>
                </div>
                <div>
                  <p className="text-slate-400">Quality</p>
                  <p className="text-white font-medium">{stream.quality}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className={`font-medium ${
                    stream.status === 'active' ? 'text-green-400' :
                    stream.status === 'processing' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {stream.status}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Viewers</p>
                  <p className="text-white font-medium">{Math.floor(Math.random() * 100)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stream URLs */}
            {stream.status === 'active' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Stream URLs</h3>
                <div className="space-y-3">
                  {stream.hlsUrl && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">HLS URL</p>
                      <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                        <span className="text-xs text-slate-300 flex-1 truncate">{stream.hlsUrl}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(stream.hlsUrl!)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {stream.dashUrl && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">DASH URL</p>
                      <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                        <span className="text-xs text-slate-300 flex-1 truncate">{stream.dashUrl}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(stream.dashUrl!)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OBS Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">OBS Configuration</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">RTMP Server</p>
                  <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300 flex-1 font-mono">rtmp://localhost:1935/live</span>
                    <button
                      onClick={() => navigator.clipboard.writeText('rtmp://localhost:1935/live')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Stream Key</p>
                  <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300 flex-1 font-mono">test</span>
                    <button
                      onClick={() => navigator.clipboard.writeText('test')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-xs">
                    Configure OBS with these settings to stream to this endpoint. 
                    The stream will be automatically converted to HLS/DASH for web playback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Embed Stream</h2>
              <button
                onClick={() => setShowEmbedCode(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Size Presets */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Size Preset</label>
                <div className="grid grid-cols-3 gap-3">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setEmbedSize({ width: preset.width, height: preset.height })}
                      className={`p-3 rounded-lg border transition-all text-sm ${
                        embedSize.width === preset.width && embedSize.height === preset.height
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <preset.icon className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs opacity-75">{preset.width}×{preset.height}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Width</label>
                  <input
                    type="number"
                    value={embedSize.width}
                    onChange={(e) => setEmbedSize(prev => ({ ...prev, width: parseInt(e.target.value) || 854 }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
                  <input
                    type="number"
                    value={embedSize.height}
                    onChange={(e) => setEmbedSize(prev => ({ ...prev, height: parseInt(e.target.value) || 480 }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Autoplay</span>
                  <button
                    onClick={() => setAutoplay(!autoplay)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoplay ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      autoplay ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Show Controls</span>
                  <button
                    onClick={() => setControls(!controls)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      controls ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      controls ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Embed Code</label>
                <div className="relative">
                  <pre className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                    {generateEmbedCode()}
                  </pre>
                  <button
                    onClick={copyEmbedCode}
                    className="absolute top-2 right-2 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEmbedCode(false)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={copyEmbedCode}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};