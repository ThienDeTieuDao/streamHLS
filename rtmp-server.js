
const NodeMediaServer = require('node-media-server');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create directories for HLS output
const hlsPath = path.join(__dirname, 'public', 'hls');
if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './public'
  },
  relay: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        mode: 'push',
        edge: 'rtmp://127.0.0.1:1935/hls'
      }
    ]
  },
  auth: {
    play: false,
    publish: false
  }
};

const nms = new NodeMediaServer(config);

// Handle stream events
nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.run();

console.log('RTMP Server started on port 1935');
console.log('HTTP Server started on port 8000');
console.log('\nOBS Configuration:');
console.log('Server: rtmp://localhost:1935/live');
console.log('Stream Key: test (or any name)');
