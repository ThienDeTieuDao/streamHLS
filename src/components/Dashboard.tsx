import React, { useEffect } from 'react';
import { User } from '../types/stream';
import { useStreams } from '../hooks/useStreams';
import { CreateStreamForm } from './CreateStreamForm';
import { StreamCard } from './StreamCard';
import { LogOut, Radio, TrendingUp, Clock, Users } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { streams, createStream, deleteStream, updateStreamStatus } = useStreams(user.id);

  useEffect(() => {
    // Simulate stream processing
    const interval = setInterval(() => {
      streams.forEach(stream => {
        if (stream.status === 'pending') {
          setTimeout(() => updateStreamStatus(stream.id, 'processing'), 2000);
        } else if (stream.status === 'processing') {
          setTimeout(() => updateStreamStatus(stream.id, 'active'), 5000);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [streams, updateStreamStatus]);

  const stats = {
    totalStreams: streams.length,
    activeStreams: streams.filter(s => s.status === 'active').length,
    totalViewers: streams.reduce((acc, stream) => acc + Math.floor(Math.random() * 100), 0),
    avgExpiry: Math.round(streams.reduce((acc, stream) => {
      const daysLeft = Math.ceil((stream.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return acc + Math.max(0, daysLeft);
    }, 0) / (streams.length || 1))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Stream Manager</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-slate-300">Open Source Streaming Server</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Streams</p>
                <p className="text-2xl font-bold text-white">{stats.totalStreams}</p>
              </div>
              <Radio className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Streams</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeStreams}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Viewers</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalViewers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg. Days Left</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.avgExpiry}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Streams</h2>
            <p className="text-slate-400">Manage your HLS and DASH stream conversions</p>
          </div>
          <CreateStreamForm onCreateStream={createStream} userId={user.id} />
        </div>

        {/* Default Stream Info */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Radio className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">OBS RTMP to HLS/DASH Conversion</h3>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <p className="text-slate-300 font-mono text-sm mb-2">rtmp://103.82.23.38/live</p>
            <p className="text-xs text-slate-400">Your RTMP endpoint - FFmpeg converts this to HLS/DASH for web preview</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-700/20 rounded-lg p-3">
              <h4 className="text-slate-300 font-medium mb-2">Why Convert?</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• RTMP not supported in web browsers</li>
                <li>• HLS/DASH enables web streaming</li>
                <li>• Better compatibility across devices</li>
                <li>• Adaptive bitrate streaming</li>
                <li>• Reliable playback with error recovery</li>
              </ul>
            </div>
            <div className="bg-slate-700/20 rounded-lg p-3">
              <h4 className="text-slate-300 font-medium mb-2">FFmpeg Process</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Receives RTMP stream from OBS</li>
                <li>• Segments into .ts video files</li>
                <li>• Creates playlist files (.m3u8/.mpd)</li>
                <li>• Serves via CDN for web delivery</li>
                <li>• Auto-retry on connection issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Streams Grid */}
        {streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map(stream => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onDelete={deleteStream}
                canDelete={stream.createdBy === user.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Radio className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No streams yet</h3>
            <p className="text-slate-400 mb-6">Create your first stream to get started with HLS/DASH conversion</p>
            <CreateStreamForm onCreateStream={createStream} userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
};