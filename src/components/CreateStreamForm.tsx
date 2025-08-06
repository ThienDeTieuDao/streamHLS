import React, { useState } from 'react';
import { Plus, Radio, Settings, Zap } from 'lucide-react';

interface CreateStreamFormProps {
  onCreateStream: (data: {
    name: string;
    sourceUrl: string;
    outputFormat: 'HLS' | 'DASH';
    quality: string;
    status: 'pending';
    createdBy: string;
  }) => void;
  userId: string;
}

export const CreateStreamForm: React.FC<CreateStreamFormProps> = ({ onCreateStream, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sourceUrl: 'rtmp://103.82.23.38/live',
    outputFormat: 'HLS' as 'HLS' | 'DASH',
    quality: '1080p'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateStream({
      ...formData,
      status: 'pending',
      createdBy: userId
    });
    setFormData({
      name: '',
      sourceUrl: 'rtmp://103.82.23.38/live',
      outputFormat: 'HLS',
      quality: '1080p'
    });
    setIsOpen(false);
  };

  const qualityOptions = ['4K', '1080p', '720p', '480p', '360p'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create New Stream
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Stream</h2>
                <p className="text-slate-400 text-sm">Convert your stream to HLS or DASH</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stream Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Live Stream"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="rtmp://example.com/live/stream"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Default: Your RTMP stream endpoint</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['HLS', 'DASH'] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, outputFormat: format }))}
                        className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                          formData.outputFormat === format
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quality
                  </label>
                  <select
                    value={formData.quality}
                    onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {qualityOptions.map(quality => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Conversion Process</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Your RTMP stream → FFmpeg → HLS/DASH segments</li>
                  <li>• Generates .m3u8 playlist and .ts video segments</li>
                  <li>• Creates web-compatible streaming format</li>
                  <li>• Auto-deletion after 7 days</li>
                  <li>• Preview available once conversion completes</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Create Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};