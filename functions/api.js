const serverless = require('serverless-http');
const app = require('../index.js');

module.exports.handler = async (event, context) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Incoming event path: ${event.path}`);
  
  // Handle Netlify functions path - redirect to API root
  if (event.path === '/.netlify/functions/api') {
    event.path = '/api';
  }
  // Handle root path requests by redirecting to API
  else if (event.path === '/') {
    event.path = '/api';
  }
  
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Processed path: ${event.path}`);
  
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
        error: error.message
      })
    };
  }
};