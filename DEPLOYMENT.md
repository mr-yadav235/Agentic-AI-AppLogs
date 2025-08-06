# 🚀 Deployment Guide - Separate Frontend Architecture

Complete deployment guide for the new microservices architecture with separated frontend applications.

## 🏗️ Architecture Overview

Your Agentic AI application now has a **microservices architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  👥 Users                                                           │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              🌐 Frontend Server (Port 3001)                 │    │
│  │  ┌─────────────────┐    ┌─────────────────────────────────┐ │    │
│  │  │   💬 Chat UI    │    │      ⚙️ Admin Console         │ │    │
│  │  │   /             │    │      /admin                    │ │    │
│  │  └─────────────────┘    └─────────────────────────────────┘ │    │
│  │                          │                                  │    │
│  │                          ▼                                  │    │
│  │                   📡 API Proxy                              │    │
│  │                   /api/* → :3000                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              🔧 Backend API Server (Port 3000)             │    │
│  │                                                             │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │    │
│  │  │ 🤖 AI       │ │ 🗄️ Config   │ │ 📊 Elasticsearch    │   │    │
│  │  │ Manager     │ │ Manager     │ │ Integration         │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (Development)

### Option 1: Unified Development Environment (Recommended)
```bash
# Start everything with one command
cd frontend
npm run dev
```

### Option 2: Manual Service Management
```bash
# Terminal 1: Backend API
npm start

# Terminal 2: Frontend Server  
cd frontend
npm start
```

## 📦 Production Deployment

### Prerequisites
```bash
# Install dependencies for all components
npm install                    # Backend dependencies
cd frontend && npm install     # Frontend dependencies
cd admin && npm install        # Admin console dependencies (optional)
cd ../chat && npm install      # Chat interface dependencies (optional)
```

### Build Applications
```bash
cd frontend
npm run build    # Build all frontend applications
```

### Start Production Services
```bash
# Method 1: Using PM2 (Recommended for production)
pm2 start ecosystem.config.js

# Method 2: Manual startup
npm start &                    # Backend API (port 3000)
cd frontend && npm start &     # Frontend Server (port 3001)
```

## 🐳 Docker Deployment

### Create Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Frontend Dockerfile  
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      - backend
    environment:
      - NODE_ENV=production
```

## 🌐 Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/agentic-ai
upstream backend {
    server localhost:3000;
}

upstream frontend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend applications
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Direct API access (optional)
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
# AI Models
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  
GOOGLE_API_KEY=your_google_key

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password

# Server Configuration
NODE_ENV=production
PORT=3000
```

### Frontend (frontend/.env)
```env
# Frontend Configuration
NODE_ENV=production
FRONTEND_PORT=3001
BACKEND_API_URL=http://localhost:3000
```

## 📊 Service Management

### Using PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start npm --name "backend" -- start
pm2 start npm --name "frontend" --cwd frontend -- start

# Monitor services
pm2 monit

# View logs
pm2 logs backend
pm2 logs frontend

# Restart services
pm2 restart all

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔍 Health Checks & Monitoring

### Service Health Endpoints
```bash
# Backend API Health
curl http://localhost:3000/api/health

# Frontend Server Health  
curl http://localhost:3001/api/health

# AI Models Health
curl http://localhost:3000/ai/health
```

### Service Status Monitoring
```bash
# Check all services
pm2 status

# Check specific ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

## 🚨 Troubleshooting

### Common Issues

#### Backend API Connection Failed
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check logs
pm2 logs backend
# or
npm start  # Check console output
```

#### Frontend Proxy Errors
```bash
# Check frontend server logs
pm2 logs frontend

# Test API proxy
curl http://localhost:3001/api/health

# Should proxy to backend and return same response as:
curl http://localhost:3000/api/health
```

#### CORS Issues
- Check CORS configuration in `server.js`
- Ensure frontend URL is in allowed origins
- Verify API requests use correct `/api/` prefix

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

## 📈 Performance Optimization

### Frontend Caching
```nginx
# Add to Nginx configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### API Rate Limiting
```javascript
// Add to backend server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins (remove localhost in production)
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Use process manager (PM2)
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 3000   # Block direct backend access
ufw deny 3001   # Block direct frontend access
ufw enable
```

## 📱 Access URLs

| Environment | Service | URL | Description |
|-------------|---------|-----|-------------|
| **Development** | Backend API | http://localhost:3000 | Direct API access |
| | Frontend Server | http://localhost:3001 | Main application |
| | Chat Interface | http://localhost:3001 | User chat UI |
| | Admin Console | http://localhost:3001/admin | Configuration panel |
| **Production** | Main Application | https://your-domain.com | Public access |
| | Admin Console | https://your-domain.com/admin | Admin interface |

## 🎯 Next Steps

1. **Test the setup**: Use `npm run dev` in frontend directory
2. **Configure your domain**: Update Nginx configuration
3. **Set up SSL**: Use Let's Encrypt or your SSL certificate
4. **Monitor services**: Set up logging and monitoring
5. **Scale as needed**: Add load balancers, multiple instances

Your Agentic AI application is now ready for professional deployment with a scalable microservices architecture! 🚀