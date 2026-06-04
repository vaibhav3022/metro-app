const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.post('http://localhost:5001/api/auth/send-otp', {
      email: 'newtest2024@gmail.com',
      isRegister: true
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

testApi();
