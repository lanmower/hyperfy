# Reverse Proxy Configuration Guide

This application is designed to run behind a reverse proxy (Nginx, Apache, Coolify, etc.) for HTTPS termination and SSL/TLS handling. The server listens on HTTP only and relies on the reverse proxy to handle encrypted connections.

## Server Configuration

The Fastify server is configured with:
- **Proxy Trust**: Enabled (default 1 hop, configurable via `TRUST_PROXY_HOPS` env var)
- **Body Limit**: 50MB for file uploads
- **Security Headers**: Automatically applied to all responses

### Environment Variables

```bash
# Number of hops to trust for X-Forwarded-* headers
TRUST_PROXY_HOPS=1

# Port the app listens on (reverse proxy should forward to this)
PORT=3000

# Node environment
NODE_ENV=production
```

## Nginx Configuration Example

```nginx
upstream hyperfy_backend {
  server localhost:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers (optional, app also sets these)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  location / {
    proxy_pass http://hyperfy_backend;
    proxy_http_version 1.1;

    # Required headers for reverse proxy
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Buffering
    proxy_buffering off;
    proxy_request_buffering off;
  }

  location /ws {
    proxy_pass http://hyperfy_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
  }
}
```

## Apache Configuration Example

```apache
<VirtualHost *:80>
  ServerName example.com
  Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
  ServerName example.com

  SSLEngine on
  SSLCertificateFile /path/to/cert.pem
  SSLCertificateKeyFile /path/to/key.pem

  # SSL configuration
  SSLProtocol TLSv1.2 TLSv1.3
  SSLCipherSuite HIGH:!aNULL:!MD5

  # Security headers
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"

  ProxyPreserveHost On
  ProxyPass / http://localhost:3000/
  ProxyPassReverse / http://localhost:3000/

  # WebSocket support
  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteRule ^/ws(.*) "ws://localhost:3000/ws$1" [P,L]
</VirtualHost>
```

## Coolify Configuration (Docker/Nixpacks)

Coolify handles HTTPS termination automatically. Ensure:

1. Enable HTTPS in Coolify dashboard
2. Configure domain in Coolify
3. Set environment variables in Coolify:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `TRUST_PROXY_HOPS=1`

4. Health check endpoint: `http://localhost:3000/health`
5. Port: 3000

## How It Works

### Request Flow with Reverse Proxy

```
Client (HTTPS)
    ↓
Reverse Proxy (TLS Termination)
    ↓ (HTTP, X-Forwarded-* headers)
Hyperfy Server (port 3000)
    ↓
Response with Security Headers
    ↓
Reverse Proxy
    ↓ (HTTPS)
Client
```

### Header Processing

The server reads these headers from the reverse proxy to understand the original request:

- `X-Forwarded-For`: Original client IP
- `X-Forwarded-Proto`: Original protocol (https)
- `X-Forwarded-Host`: Original host
- `X-Forwarded-Port`: Original port
- `X-Real-IP`: Alternative client IP

These are used for logging, CORS validation, and analytics.

## Security Implications

✓ **SSL/TLS**: Handled by reverse proxy (stronger configuration possible)
✓ **Certificate Management**: Centralized at reverse proxy (easier renewal with Let's Encrypt)
✓ **DDoS Protection**: Can be added at reverse proxy layer
✓ **Rate Limiting**: Can be enforced at reverse proxy
✓ **WAF (Web Application Firewall)**: Can be added at reverse proxy
✓ **Compression**: Handled efficiently at reverse proxy
✓ **Static File Caching**: Can be cached at reverse proxy

## Troubleshooting

### Client IP Shows as Proxy IP

Ensure `TRUST_PROXY_HOPS` environment variable matches your proxy chain depth. For most setups, `TRUST_PROXY_HOPS=1` is correct.

### WebSocket Connections Failing

Check that reverse proxy:
1. Passes `Upgrade` and `Connection` headers
2. Disables buffering
3. Sets appropriate timeout for long-lived connections

### CORS Issues

CORS configuration already accounts for proxy scenarios. Ensure reverse proxy passes original `Origin` and `Host` headers correctly.

### Health Checks Timing Out

Default health check timeout is 5 seconds. If reverse proxy health checks timeout:
1. Increase timeout in Coolify/Docker settings
2. Check `/health` endpoint responsiveness
3. Check database and cache connectivity

## Production Checklist

- [ ] HTTPS enabled at reverse proxy
- [ ] Certificate auto-renewal configured (Let's Encrypt)
- [ ] `TRUST_PROXY_HOPS` environment variable set correctly
- [ ] Reverse proxy health checks configured
- [ ] WebSocket connections tested
- [ ] Request logging includes correct client IPs
- [ ] CORS origins properly configured
- [ ] Rate limiting working at reverse proxy or app level
- [ ] DDoS protection enabled (optional)
- [ ] WAF enabled (optional)
