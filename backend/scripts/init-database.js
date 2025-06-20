const { initializeDatabase, closeDatabase } = require('../database/init');
const path = require('path');
const fs = require('fs');

async function initDatabase() {
  try {
    console.log('🚀 Initializing FinTrack Database...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Create tables and insert initial data
    const { createTables } = require('../database/init');
    await createTables();
    
    console.log('✅ Database initialized successfully!');
    console.log('📊 Database location:', path.resolve(process.env.DB_PATH || './database/fintrack.db'));
    
    // Close database connection
    await closeDatabase();
    
    console.log('🔒 Database connection closed');
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase }; 