console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Loading api.js function`);
const app = require('../index');
console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Successfully loaded index.js`);

module.exports.handler = async (event, context) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Invoking api function with event:`, {
    path: event.path,
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  });

  try {
    const response = await app.handler(event, context);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Api function response:`, {
      statusCode: response.statusCode,
      body: response.body
    });
    return response;
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Api function error:`, {
      message: error.message,
      stack: error.stack
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Server error in api.js',
        error: error.message
      })
    };
  }
};