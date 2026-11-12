const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('--- Starting Margins Digital Library Server ---');
  
  // Test DB connection before listening
  const databaseReady = await testConnection();
  if (!databaseReady) {
    console.error(' Server startup aborted because MySQL is unavailable.');
    process.exitCode = 1;
    return;
  }

  app.listen(PORT, () => {
    console.log(` Margins Server running on http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Session authentication ready`);
  });
}

startServer();
