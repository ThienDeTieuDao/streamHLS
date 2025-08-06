export interface Stream {
  id: string;
  name: string;
  sourceUrl: string;
  outputFormat: 'HLS' | 'DASH';
  quality: string;
  status: 'pending' | 'processing' | 'active' | 'error' | 'stopped';
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  hlsUrl?: string;
  dashUrl?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface StreamStats {
  viewers: number;
  bitrate: string;
  duration: string;
}