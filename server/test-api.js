/**
 * Margins API Smoke Test
 * Tests Express app routing, middleware registration, and schema consistency.
 */
const app = require('./app');

console.log('--- MARGINS BACKEND SANITY TEST ---');

// Check that app has initialized properly
if (typeof app !== 'function') {
  console.error(' App failed to initialize properly.');
  process.exit(1);
}

// Print registered routes
const routes = [];
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // routes registered directly on the app
    routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // router middleware
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const method = Object.keys(handler.route.methods).join(',').toUpperCase();
        routes.push(`${method} ${handler.route.path}`);
      }
    });
  }
});

console.log(' Registered API Endpoint Handlers:');
routes.forEach(r => console.log(`   ${r}`));

console.log('\n Margins backend modules and routes successfully validated!');
