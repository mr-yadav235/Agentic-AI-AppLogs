# 🎨 Agentic AI Frontend Applications

Separate frontend architecture for the Agentic AI Log Analytics platform with dedicated admin console and chat interface.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Chat UI       │    │  Admin Console  │                │
│  │   Port: 3002    │    │   Port: 3003    │                │
│  │  (standalone)   │    │  (standalone)   │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────┐       ┌───────┘                        │
│                   │       │                                │
│              ┌─────────────────┐                           │
│              │ Frontend Server │                           │
│              │   Port: 3001    │                           │
│              │   (serves both) │                           │
│              └─────────────────┘                           │
│                       │                                    │
│                ┌──────────────┐                            │
│                │ API Proxy    │                            │
│                │ /api/* → :3000│                           │
│                └──────────────┘                            │
│                       │                                    │
├───────────────────────┼────────────────────────────────────┤
│                       │                                    │
│              ┌─────────────────┐                           │
│              │ Backend API     │                           │
│              │   Port: 3000    │                           │
│              │  (API Only)     │                           │
│              └─────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Unified Development (Recommended)
```bash
# Start both backend and frontend together
cd frontend
npm install
npm run dev
```

### Option 2: Separate Services
```bash
# Terminal 1: Start Backend API
npm start

# Terminal 2: Start Frontend Server
cd frontend
npm install
npm start

# Terminal 3: Start Admin Console (optional)
cd frontend/admin
npm install
npm start

# Terminal 4: Start Chat UI (optional)
cd frontend/chat
npm install
npm start
```

## 📁 Directory Structure

```
frontend/
├── admin/                  # Standalone Admin Console
│   ├── index.html         # Admin interface
│   ├── package.json       # Admin dependencies
│   └── README.md          # Admin documentation
├── chat/                  # Standalone Chat Interface
│   ├── index.html         # Chat interface
│   ├── package.json       # Chat dependencies
│   └── README.md          # Chat documentation
├── shared/                # Shared components & utilities
│   ├── api.js             # API communication layer
│   ├── utils.js           # Common utilities
│   └── styles.css         # Shared styles
├── public/                # Built applications for serving
│   ├── admin/             # Built admin console
│   └── chat/              # Built chat interface
├── scripts/               # Development & build scripts
│   ├── dev.js             # Development environment
│   ├── build.js           # Build all applications
│   └── deploy.js          # Deployment script
├── server.js              # Frontend server with API proxy
├── package.json           # Frontend server dependencies
└── README.md              # This file
```

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | Pure API server |
| **Frontend Server** | http://localhost:3001 | Serves both UIs |
| **Chat Interface** | http://localhost:3001 | Main chat UI |
| **Admin Console** | http://localhost:3001/admin | Configuration panel |
| **API Health** | http://localhost:3000/api/health | API status |

### Standalone Access (if running separately)
| Service | URL | Description |
|---------|-----|-------------|
| **Admin Console** | http://localhost:3003 | Direct admin access |
| **Chat Interface** | http://localhost:3002 | Direct chat access |

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development environment (backend + frontend)
npm run dev

# Build all applications
npm run build

# Start only frontend server
npm start

# Build individual applications
npm run build:admin
npm run build:chat
```

## 🏗️ Build Process

The build process copies and optimizes the applications:

1. **Admin Console**: Static HTML with API proxy integration
2. **Chat Interface**: Static HTML with API proxy integration  
3. **Frontend Server**: Express server with API proxy and routing

## 🔌 API Integration

All frontend applications communicate with the backend through API proxy:

```javascript
// Frontend makes requests to /api/*
fetch('/api/query', { ... })
fetch('/api/admin/config', { ... })
fetch('/api/ai/health', { ... })

// Frontend server proxies to backend
/api/* → http://localhost:3000/*
```

## 🎯 Benefits of This Architecture

✅ **Separation of Concerns**: Clean separation between frontend and backend  
✅ **Scalability**: Each frontend can be scaled independently  
✅ **Development**: Better development experience with hot reloading  
✅ **Deployment**: Flexible deployment options (CDN, containers, etc.)  
✅ **Maintenance**: Easier to maintain and update individual components  
✅ **Security**: Backend API can be properly secured  

## 🔒 Security Features

- **CORS Configuration**: Proper cross-origin resource sharing setup
- **API Proxy**: Secure API communication through proxy
- **Environment Isolation**: Frontend and backend environments separated
- **Input Validation**: API requests properly validated

## 🐛 Troubleshooting

### Backend Connection Issues
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check backend logs
npm start # In main directory
```

### Frontend Proxy Issues
```bash
# Check frontend server logs
cd frontend && npm start

# Test API proxy
curl http://localhost:3001/api/health
```

### Port Conflicts
```bash
# Change ports in package.json or use environment variables
FRONTEND_PORT=3005 npm start
```

## 📚 Related Documentation

- [Backend API Documentation](../README.md)
- [Admin Console Guide](./admin/README.md)
- [Chat Interface Guide](./chat/README.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🤝 Contributing

1. Make changes to individual applications in their directories
2. Test using `npm run dev`
3. Build using `npm run build`
4. Update documentation as needed

## 📄 License

Same as main project - ISC License