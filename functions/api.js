const serverless = require('serverless-http');
const app = require('../index.js');

module.exports.handler = async (event, context) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Incoming event path: ${event.path}`);
  // Normalize path: remove "/.netlify/functions/api" prefix
  event.path = event.path.replace('/.netlify/functions/api', '') || '/';
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Normalized path: ${event.path}`);
  return serverless(app)(event, context);
};