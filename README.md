# HLS/DASH Streaming Server

A complete streaming server solution with RTMP input and HLS/DASH output, featuring a modern web management panel.

## Features

- **RTMP to HLS/DASH Conversion**: Automatic conversion using FFmpeg
- **Multi-Quality Streaming**: 1080p, 720p, and 480p variants
- **Web Management Panel**: Modern React-based dashboard
- **User Authentication**: Stream ownership and management
- **Auto-Deletion**: Streams automatically deleted after 7 days
- **Real-time Preview**: Web-based stream preview with error handling
- **Embed Support**: Generate embed codes for other websites

## Quick Installation

### Automatic Installation (Recommended)

```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/your-repo/streaming-server/main/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh
```

### With SSL Certificate

```bash
sudo ./install.sh --domain yourdomain.com --email your@email.com --ssl
```

## Manual Installation

### Prerequisites

- Ubuntu 18.04+ / Debian 10+ / CentOS 7+
- Root access
- At least 2GB RAM
- 10GB free disk space

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build tools
sudo apt install -y build-essential curl wget git
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3: Install FFmpeg

```bash
sudo apt install -y ffmpeg libavcodec-extra
```

### Step 4: Compile Nginx with RTMP

```bash
# Install dependencies
sudo apt install -y libpcre3-dev libssl-dev zlib1g-dev

# Download and compile
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip -O nginx-rtmp-module.zip

tar -xzf nginx-1.24.0.tar.gz
unzip nginx-rtmp-module.zip

cd nginx-1.24.0
./configure --add-module=../nginx-rtmp-module-master --with-http_ssl_module
make && sudo make install
```

## Configuration

### OBS Studio Setup

1. **Server**: `rtmp://YOUR_SERVER_IP:1935/live`
2. **Stream Key**: Any name you want (e.g., `mystream`)

### Accessing Streams

- **Web Panel**: `http://YOUR_SERVER_IP`
- **HLS Stream**: `http://YOUR_SERVER_IP/hls/STREAM_NAME/index.m3u8`
- **DASH Stream**: `http://YOUR_SERVER_IP/dash/STREAM_NAME/index.mpd`

## Usage

### Creating a Stream

1. Access the web panel at `http://YOUR_SERVER_IP`
2. Login with any username/password (demo mode)
3. Click "Create New Stream"
4. Enter stream name and configure settings
5. Use the generated RTMP URL in OBS

### Stream Management

- **View Stream**: Click the external link icon to open in new tab
- **Embed Stream**: Click "Embed" to generate HTML code
- **Delete Stream**: Only stream creators can delete their streams
- **Auto-Deletion**: Streams are automatically deleted after 7 days

## API Endpoints

### Stream URLs

```
GET /hls/{stream_name}/index.m3u8    # HLS playlist
GET /dash/{stream_name}/index.mpd    # DASH manifest
GET /nginx_status                    # Nginx statistics
GET /stat                           # RTMP statistics
```

## File Structure

```
/opt/streaming-panel/          # Web application
/var/hls/                     # HLS output files
/var/dash/                    # DASH output files
/var/recordings/              # Stream recordings (optional)
/etc/nginx/nginx.conf         # Nginx configuration
/var/log/nginx/               # Nginx logs
```

## Troubleshooting

### Common Issues

1. **Stream not appearing**: Check if OBS is streaming to the correct RTMP URL
2. **Web panel not loading**: Verify Node.js service is running
3. **Permission errors**: Ensure nginx user has write access to stream directories

### Useful Commands

```bash
# Check service status
sudo systemctl status nginx
sudo systemctl status streaming-panel

# View logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u streaming-panel -f

# Restart services
sudo systemctl restart nginx streaming-panel
```

### Port Configuration

- **HTTP**: 80 (web panel and streams)
- **HTTPS**: 443 (if SSL enabled)
- **RTMP**: 1935 (stream input)
- **Web Panel**: 3000 (internal)

## Security

### Firewall Rules

The installer automatically configures firewall rules. Manual configuration:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1935/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=1935/tcp
sudo firewall-cmd --reload
```

### SSL Certificate

For production use, enable SSL:

```bash
sudo ./install.sh --domain yourdomain.com --email your@email.com --ssl
```

## Performance Tuning

### For High Traffic

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 4096;
```

### FFmpeg Optimization

For better performance, adjust FFmpeg settings in the Nginx configuration:

```nginx
exec ffmpeg -i rtmp://localhost/live/$name 
    -c:v libx264 -preset ultrafast -tune zerolatency
    -c:a aac -b:a 128k -f flv rtmp://localhost/hls/$name;
```

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review system logs
3. Verify OBS streaming configuration
4. Ensure all services are running

## License

MIT License - see LICENSE file for details.