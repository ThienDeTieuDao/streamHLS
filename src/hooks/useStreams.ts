import { useState, useEffect } from 'react';
import { Stream } from '../types/stream';

export const useStreams = (userId: string) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json'
    };
  };

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams', {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const formattedStreams = data.streams.map((stream: any) => ({
          id: stream.id.toString(),
          title: stream.title,
          description: stream.description,
          quality: stream.quality,
          status: stream.status,
          rtmpUrl: stream.rtmp_url,
          hlsUrl: stream.hls_url,
          createdAt: new Date(stream.created_at),
          expiresAt: new Date(stream.expires_at),
          streamKey: stream.stream_key,
          viewerCount: stream.viewers_count || 0
        }));
        setStreams(formattedStreams);
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, [userId]);

  const createStream = async (title: string, description: string, quality: string) => {
    try {
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, description, quality })
      });

      if (response.ok) {
        const data = await response.json();
        const newStream = {
          id: data.stream.id.toString(),
          title: data.stream.title,
          description: data.stream.description,
          quality: data.stream.quality,
          status: data.stream.status,
          rtmpUrl: data.stream.rtmp_url,
          hlsUrl: data.stream.hls_url,
          createdAt: new Date(data.stream.created_at),
          expiresAt: new Date(data.stream.expires_at),
          streamKey: data.stream.stream_key,
          viewerCount: 0
        };
        setStreams(prev => [newStream, ...prev]);
        return newStream;
      }
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  };

  const deleteStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (response.ok) {
        setStreams(prev => prev.filter(stream => stream.id !== streamId));
      }
    } catch (error) {
      console.error('Failed to delete stream:', error);
    }
  };

  const updateStreamStatus = async (streamId: string, status: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setStreams(prev => prev.map(stream => 
          stream.id === streamId ? { ...stream, status } : stream
        ));
      }
    } catch (error) {
      console.error('Failed to update stream status:', error);
    }
  };

  return {
    streams,
    loading,
    createStream,
    deleteStream,
    updateStreamStatus,
    refreshStreams: fetchStreams
  };
};