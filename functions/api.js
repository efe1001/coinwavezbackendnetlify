const serverless = require('serverless-http');
const app = require('../index.js');

module.exports.handler = async (event, context) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Incoming event path: ${event.path}`);
  // Normalize path: remove "/.netlify/functions" prefix, preserve "/api/*"
  event.path = event.path.replace('/.netlify/functions', '');
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Normalized path: ${event.path}`);
  
  const response = await serverless(app)(event, context);
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Response:`, {
    statusCode: response.statusCode,
    body: response.body
  });
  return response;
};