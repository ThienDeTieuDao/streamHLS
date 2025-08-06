#!/bin/bash

# =============================================================================
# HLS/DASH Streaming Server Auto-Installation Script
# =============================================================================
# This script installs and configures:
# - Nginx with RTMP module
# - FFmpeg with all codecs
# - Node.js and the streaming web panel
# - SSL certificates (optional)
# - Firewall configuration
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN=""
EMAIL=""
INSTALL_SSL=false
WEB_PORT=3000
RTMP_PORT=1935
HTTP_PORT=80
HTTPS_PORT=443

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS version"
        exit 1
    fi
    
    print_status "Detected OS: $OS $VER"
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git build-essential software-properties-common
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum groupinstall -y "Development Tools"
        yum install -y curl wget git epel-release
    else
        print_error "Unsupported operating system: $OS"
        exit 1
    fi
    
    print_success "System updated successfully"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y nodejs
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum install -y nodejs npm
    fi
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js $node_version and npm $npm_version installed"
}

# Function to install FFmpeg
install_ffmpeg() {
    print_status "Installing FFmpeg with all codecs..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Install FFmpeg from default repositories
        apt install -y ffmpeg \
            libavcodec-extra \
            x264 \
            x265 \
            libx264-160 \
            libx265-199
            
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        # Install RPM Fusion repositories
        yum install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
        yum install -y https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm
        
        # Install FFmpeg
        yum install -y ffmpeg ffmpeg-devel
    fi
    
    # Verify FFmpeg installation
    ffmpeg_version=$(ffmpeg -version | head -n1)
    print_success "FFmpeg installed: $ffmpeg_version"
}

# Function to compile and install Nginx with RTMP module
install_nginx_rtmp() {
    print_status "Compiling Nginx with RTMP module..."
    
    # Install dependencies
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y libpcre3-dev libssl-dev zlib1g-dev libgeoip-dev
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum install -y pcre-devel openssl-devel zlib-devel GeoIP-devel
    fi
    
    # Create nginx user
    useradd -r -s /bin/false nginx || true
    
    # Download Nginx and RTMP module
    cd /tmp
    NGINX_VERSION="1.24.0"
    wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
    wget https://github.com/arut/nginx-rtmp-module/archive/master.zip -O nginx-rtmp-module.zip
    
    # Extract files
    tar -xzf nginx-${NGINX_VERSION}.tar.gz
    unzip nginx-rtmp-module.zip
    
    # Compile Nginx with RTMP module
    cd nginx-${NGINX_VERSION}
    ./configure \
        --prefix=/etc/nginx \
        --sbin-path=/usr/sbin/nginx \
        --modules-path=/usr/lib/nginx/modules \
        --conf-path=/etc/nginx/nginx.conf \
        --error-log-path=/var/log/nginx/error.log \
        --http-log-path=/var/log/nginx/access.log \
        --pid-path=/var/run/nginx.pid \
        --lock-path=/var/run/nginx.lock \
        --http-client-body-temp-path=/var/cache/nginx/client_temp \
        --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
        --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
        --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
        --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
        --user=nginx \
        --group=nginx \
        --with-compat \
        --with-file-aio \
        --with-threads \
        --with-http_addition_module \
        --with-http_auth_request_module \
        --with-http_dav_module \
        --with-http_flv_module \
        --with-http_gunzip_module \
        --with-http_gzip_static_module \
        --with-http_mp4_module \
        --with-http_random_index_module \
        --with-http_realip_module \
        --with-http_secure_link_module \
        --with-http_slice_module \
        --with-http_ssl_module \
        --with-http_stub_status_module \
        --with-http_sub_module \
        --with-http_v2_module \
        --with-stream \
        --with-stream_realip_module \
        --with-stream_ssl_module \
        --with-stream_ssl_preread_module \
        --add-module=../nginx-rtmp-module-master
    
    make -j$(nproc)
    make install
    
    # Create necessary directories
    mkdir -p /var/cache/nginx/client_temp
    mkdir -p /var/cache/nginx/proxy_temp
    mkdir -p /var/cache/nginx/fastcgi_temp
    mkdir -p /var/cache/nginx/uwsgi_temp
    mkdir -p /var/cache/nginx/scgi_temp
    mkdir -p /var/www/html
    mkdir -p /var/hls
    mkdir -p /var/dash
    mkdir -p /var/recordings
    
    # Set permissions
    chown -R nginx:nginx /var/cache/nginx
    chown -R nginx:nginx /var/hls
    chown -R nginx:nginx /var/dash
    chown -R nginx:nginx /var/recordings
    chmod -R 755 /var/hls
    chmod -R 755 /var/dash
    chmod -R 755 /var/recordings
    
    print_success "Nginx with RTMP module compiled and installed"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create main nginx configuration
    cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

# RTMP configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        allow publish all;
        allow play all;

        application live {
            live on;
            record off;
            allow publish all;
            allow play all;
            
            # HLS configuration
            hls on;
            hls_path /var/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            hls_continuous on;
            hls_cleanup on;
            hls_nested on;
            
            # DASH configuration
            dash on;
            dash_path /var/dash;
            dash_fragment 3;
            dash_playlist_length 60;
            dash_nested on;
            dash_cleanup on;
            
            # FFmpeg transcoding
            exec ffmpeg -i rtmp://127.0.0.1:1935/live/$name -async 1 -vsync -1
                        -c:v libx264 -c:a aac -b:v 2500k -b:a 128k -vf "scale=1920:1080" -tune zerolatency -preset veryfast -crf 23 -f flv rtmp://127.0.0.1:1935/hls/$name_1080p
                        -c:v libx264 -c:a aac -b:v 1000k -b:a 128k -vf "scale=1280:720" -tune zerolatency -preset veryfast -crf 23 -f flv rtmp://127.0.0.1:1935/hls/$name_720p
                        -c:v libx264 -c:a aac -b:v 500k -b:a 96k -vf "scale=854:480" -tune zerolatency -preset veryfast -crf 23 -f flv rtmp://127.0.0.1:1935/hls/$name_480p;
        }
        
        application hls {
            live on;
            hls on;
            hls_path /var/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            hls_continuous on;
            hls_cleanup on;
            hls_nested on;
        }
    }
}

# HTTP configuration
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # HLS/DASH serving
    server {
        listen 80;
        server_name _;

        # CORS headers for streaming
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header Access-Control-Expose-Headers 'Content-Length,Content-Range';

        # HLS files
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var;
            expires -1;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }

        # DASH files
        location /dash {
            types {
                application/dash+xml mpd;
                video/mp4 mp4;
            }
            root /var;
            expires -1;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }

        # Web panel proxy
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_buffering off;
        }

        # Nginx status
        location /nginx_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            deny all;
        }

        # RTMP statistics
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
            allow 127.0.0.1;
            deny all;
        }
    }
}
EOF

    # Create systemd service file
    cat > /etc/systemd/system/nginx.service << 'EOF'
[Unit]
Description=The nginx HTTP and reverse proxy server
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
KillSignal=SIGQUIT
TimeoutStopSec=5
KillMode=process
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start nginx
    systemctl daemon-reload
    systemctl enable nginx
    
    print_success "Nginx configured successfully"
}

# Function to setup web panel
setup_web_panel() {
    print_status "Setting up streaming web panel..."
    
    # Create application directory
    mkdir -p /opt/streaming-panel
    cd /opt/streaming-panel
    
    # Initialize package.json
    cat > package.json << 'EOF'
{
  "name": "streaming-panel",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "vite": "^5.4.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.7.1",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35"
  }
}
EOF

    # Create production server
    cat > server.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Streaming panel running on port ${PORT}`);
});
EOF

    # Install dependencies
    npm install
    
    # Create systemd service for web panel
    cat > /etc/systemd/system/streaming-panel.service << 'EOF'
[Unit]
Description=Streaming Panel Web Application
After=network.target

[Service]
Type=simple
User=nginx
WorkingDirectory=/opt/streaming-panel
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    # Set permissions
    chown -R nginx:nginx /opt/streaming-panel
    
    # Enable service
    systemctl daemon-reload
    systemctl enable streaming-panel
    
    print_success "Web panel setup completed"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw --force enable
        ufw allow ssh
        ufw allow $HTTP_PORT
        ufw allow $HTTPS_PORT
        ufw allow $RTMP_PORT
        ufw allow $WEB_PORT
        print_success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-port=$HTTP_PORT/tcp
        firewall-cmd --permanent --add-port=$HTTPS_PORT/tcp
        firewall-cmd --permanent --add-port=$RTMP_PORT/tcp
        firewall-cmd --permanent --add-port=$WEB_PORT/tcp
        firewall-cmd --reload
        print_success "Firewalld configured"
    else
        print_warning "No firewall detected. Please configure manually."
    fi
}

# Function to install SSL certificate
install_ssl() {
    if [[ "$INSTALL_SSL" == true ]] && [[ -n "$DOMAIN" ]] && [[ -n "$EMAIL" ]]; then
        print_status "Installing SSL certificate..."
        
        # Install Certbot
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            apt install -y certbot python3-certbot-nginx
        elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
            yum install -y certbot python3-certbot-nginx
        fi
        
        # Get SSL certificate
        certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        print_success "SSL certificate installed for $DOMAIN"
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    systemctl start nginx
    systemctl start streaming-panel
    
    # Check service status
    if systemctl is-active --quiet nginx; then
        print_success "Nginx started successfully"
    else
        print_error "Failed to start Nginx"
        systemctl status nginx
    fi
    
    if systemctl is-active --quiet streaming-panel; then
        print_success "Streaming panel started successfully"
    else
        print_error "Failed to start streaming panel"
        systemctl status streaming-panel
    fi
}

# Function to display final information
display_info() {
    print_success "Installation completed successfully!"
    echo
    echo "==============================================================================="
    echo -e "${GREEN}STREAMING SERVER INFORMATION${NC}"
    echo "==============================================================================="
    echo -e "Web Panel: ${BLUE}http://$(curl -s ifconfig.me):$HTTP_PORT${NC}"
    echo -e "RTMP Endpoint: ${BLUE}rtmp://$(curl -s ifconfig.me):$RTMP_PORT/live${NC}"
    echo -e "HLS Streams: ${BLUE}http://$(curl -s ifconfig.me):$HTTP_PORT/hls/${NC}"
    echo -e "DASH Streams: ${BLUE}http://$(curl -s ifconfig.me):$HTTP_PORT/dash/${NC}"
    echo
    echo "==============================================================================="
    echo -e "${YELLOW}OBS STUDIO CONFIGURATION${NC}"
    echo "==============================================================================="
    echo -e "Server: ${BLUE}rtmp://$(curl -s ifconfig.me):$RTMP_PORT/live${NC}"
    echo -e "Stream Key: ${BLUE}your-stream-name${NC} (any name you want)"
    echo
    echo "==============================================================================="
    echo -e "${YELLOW}USEFUL COMMANDS${NC}"
    echo "==============================================================================="
    echo "Check Nginx status: systemctl status nginx"
    echo "Check web panel: systemctl status streaming-panel"
    echo "View Nginx logs: tail -f /var/log/nginx/error.log"
    echo "Restart services: systemctl restart nginx streaming-panel"
    echo
    if [[ "$INSTALL_SSL" == true ]] && [[ -n "$DOMAIN" ]]; then
        echo -e "SSL Web Panel: ${BLUE}https://$DOMAIN${NC}"
    fi
    echo "==============================================================================="
}

# Main installation function
main() {
    echo "==============================================================================="
    echo -e "${GREEN}HLS/DASH Streaming Server Auto-Installer${NC}"
    echo "==============================================================================="
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --ssl)
                INSTALL_SSL=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --domain DOMAIN    Domain name for SSL certificate"
                echo "  --email EMAIL      Email for SSL certificate"
                echo "  --ssl              Install SSL certificate"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run installation steps
    check_root
    detect_os
    update_system
    install_nodejs
    install_ffmpeg
    install_nginx_rtmp
    configure_nginx
    setup_web_panel
    configure_firewall
    install_ssl
    start_services
    display_info
    
    print_success "Installation completed! Your streaming server is ready to use."
}

# Run main function
main "$@"