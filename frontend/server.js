const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('public'));

// Proxy API requests to backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix when forwarding to backend
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ 
      error: 'Backend service unavailable',
      message: 'Please ensure the backend server is running on port 3000'
    });
  }
}));

// Route for admin console
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Route for chat interface (default)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat/index.html'));
});

const PORT = process.env.FRONTEND_PORT || 3001;

app.listen(PORT, () => {
  console.log('🎨 Frontend Server Configuration:');
  console.log('=====================================');
  console.log(`🌐 Frontend Server: http://localhost:${PORT}`);
  console.log(`💬 Chat Interface: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Console:  http://localhost:${PORT}/admin`);
  console.log(`🔌 API Proxy:      http://localhost:${PORT}/api/*`);
  console.log('');
  console.log('📡 Backend Dependencies:');
  console.log(`   API Server: http://localhost:3000 (must be running)`);
  console.log('');
  console.log('🚀 Quick Start:');
  console.log('   1. Start backend: npm start (in main directory)');
  console.log('   2. Start frontend: npm start (in frontend directory)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Frontend server shutting down gracefully...');
  process.exit(0);
});