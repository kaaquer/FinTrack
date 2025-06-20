const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAuthFlow() {
  try {
    console.log('Testing complete authentication flow...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data.status);
    
    // Test login with existing user
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   - Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('   - User data:', loginResponse.data.user.email);
    
    // Test customers endpoint with token
    const token = loginResponse.data.token;
    const customersResponse = await axios.get(`${API_BASE_URL}/customers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Customers endpoint working with authentication');
    console.log('   - Response format:', Object.keys(customersResponse.data));
    console.log('   - Customers count:', customersResponse.data.customers.length);
    
    // Test without token (should fail)
    try {
      await axios.get(`${API_BASE_URL}/customers`);
      console.log('❌ Customers endpoint should have failed without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Customers endpoint correctly rejects requests without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    console.log('🎉 Authentication flow is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthFlow(); 