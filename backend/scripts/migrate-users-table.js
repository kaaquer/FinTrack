const { initializeDatabase, runQuery } = require('../database/init');

async function migrateUsersTable() {
  try {
    console.log('Starting users table migration...');
    
    // Add reset_token column if it doesn't exist
    try {
      await runQuery(`
        ALTER TABLE users ADD COLUMN reset_token TEXT
      `);
      console.log('✓ Added reset_token column');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('✓ reset_token column already exists');
      } else {
        throw error;
      }
    }
    
    // Add reset_token_expiry column if it doesn't exist
    try {
      await runQuery(`
        ALTER TABLE users ADD COLUMN reset_token_expiry TEXT
      `);
      console.log('✓ Added reset_token_expiry column');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('✓ reset_token_expiry column already exists');
      } else {
        throw error;
      }
    }
    
    console.log('Users table migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  (async () => {
    await initializeDatabase();
    await migrateUsersTable();
  })();
}

module.exports = { migrateUsersTable }; 