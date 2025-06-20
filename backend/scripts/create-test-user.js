const bcrypt = require('bcryptjs');
const { initializeDatabase, runQuery, getRow, closeDatabase } = require('../database/init');

async function createTestUser() {
  try {
    console.log('🚀 Creating test user...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Check if test user already exists
    const existingUser = await getRow(
      'SELECT user_id FROM users WHERE email = ?',
      ['test@fintrack.com']
    );
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      return;
    }
    
    // Create a test business first
    const businessResult = await runQuery(`
      INSERT INTO businesses (
        business_name, business_type, email, phone, address, city, state, country, postal_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Test Business',
      'LLC',
      'test@fintrack.com',
      '+1234567890',
      '123 Test St',
      'Test City',
      'Test State',
      'Test Country',
      '12345'
    ]);
    
    const businessId = businessResult.id;
    console.log('✅ Test business created with ID:', businessId);
    
    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create test user
    const userResult = await runQuery(`
      INSERT INTO users (
        business_id, email, password_hash, first_name, last_name, role
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      businessId,
      'test@fintrack.com',
      passwordHash,
      'Test',
      'User',
      'admin'
    ]);
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@fintrack.com');
    console.log('🔑 Password: password123');
    console.log('🆔 User ID:', userResult.id);
    console.log('🏢 Business ID:', businessId);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser }; 