const serverless = require('serverless-http');
const app = require('../index.js');

// Normalize path to remove "/.netlify/functions/api" prefix
module.exports.handler = async (event, context) => {
  // Strip "/.netlify/functions/api" from the path
  event.path = event.path.replace('/.netlify/functions/api', '') || '/';
  return serverless(app)(event, context);
};