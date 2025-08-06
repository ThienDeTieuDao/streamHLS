import React from 'react';
import { Stream } from '../types/stream';
import { Play, Trash2, Copy, Clock, Users, Activity, ExternalLink } from 'lucide-react';
import { StreamPlayer } from './StreamPlayer';

interface StreamCardProps {
  stream: Stream;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onDelete, canDelete }) => {
  const getDaysRemaining = () => {
    const now = new Date();
    const diffTime = stream.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = () => {
    switch (stream.status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'processing': return 'text-yellow-400 bg-yellow-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
      case 'stopped': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-blue-400 bg-blue-400/10';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openStreamView = () => {
    window.open(`/stream/${stream.id}`, '_blank');
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
      {/* Stream Preview */}
      <div className="p-4 pb-0">
        <StreamPlayer
          hlsUrl={stream.hlsUrl}
          dashUrl={stream.dashUrl}
          streamName={stream.name}
          status={stream.status}
        />
      </div>
      
      <div className="p-6 pt-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{stream.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {stream.status}
            </span>
            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
              {stream.outputFormat}
            </span>
            <button
              onClick={openStreamView}
              className="text-slate-400 hover:text-blue-400 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(stream.id)}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Activity className="w-4 h-4" />
          <span>Quality: {stream.quality}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="w-4 h-4" />
          <span>Expires in {daysRemaining} days</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Users className="w-4 h-4" />
          <span>Viewers: {Math.floor(Math.random() * 100)}</span>
        </div>
      </div>

      {stream.status === 'active' && (
        <div className="space-y-2">
          {stream.hlsUrl && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
              <Play className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-300 flex-1 truncate">HLS: {stream.hlsUrl}</span>
              <button
                onClick={() => copyToClipboard(stream.hlsUrl!)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {stream.dashUrl && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg">
              <Play className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-300 flex-1 truncate">DASH: {stream.dashUrl}</span>
              <button
                onClick={() => copyToClipboard(stream.dashUrl!)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 bg-slate-700/20 rounded-lg p-2">
        <div className="text-xs text-slate-400 mb-1">Auto-delete progress</div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${((7 - daysRemaining) / 7) * 100}%` }}
          />
        </div>
      </div>
    </div>
    </div>
  );
};