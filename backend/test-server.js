const express = require('express');

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test server is working', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/test`);
});