const http = require('https');

const data = JSON.stringify({
  email: 'test@gmail.com',
  isRegister: true
});

const options = {
  hostname: 'metro-app-1-vt0n.onrender.com',
  port: 443,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Sending POST request to live Render API gateway...");
const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log("Response Body:", responseData);
  });
});

req.on('error', (error) => {
  console.error("HTTP Request Error:", error);
});

req.write(data);
req.end();
