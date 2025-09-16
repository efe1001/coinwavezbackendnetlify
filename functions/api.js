const serverless = require('serverless-http');
const app = require('../index.js');

module.exports.handler = async (event, context) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Incoming event path: ${event.path}`);
  
  // Store the original path for logging
  const originalPath = event.path;
  
  // Handle Netlify functions path - convert to Express routes
  if (event.path.startsWith('/.netlify/functions/api')) {
    // Convert Netlify function path to Express route
    event.path = event.path.replace('/.netlify/functions/api', '');
  }
  
  // Handle API paths that come through redirect
  if (event.path.startsWith('/api/')) {
    // Keep as is for Express routes
    event.path = event.path;
  }
  
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Processed path: ${event.path}`);
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Original path: ${originalPath}`);
  
  try {
    const response = await serverless(app)(event, context);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Response status: ${response.statusCode}`);
    return response;
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Handler error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Server error',
        error: error.message,
        originalPath: originalPath,
        processedPath: event.path
      })
    };
  }
};