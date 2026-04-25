import { createAdminUser } from '../lib/auth.ts';

async function initializeAdmin() {
  try {
    console.log('Initializing admin user...');

    // Create default admin user for testing
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';

    const user = await createAdminUser(defaultUsername, defaultPassword);

    if (user) {
      console.log(`✓ Admin user created: ${user.username}`);
    } else {
      console.log('⚠ Admin user may already exist or failed to create');
    }

    console.log('\nDefault credentials:');
    console.log(`Username: ${defaultUsername}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('\n⚠ IMPORTANT: Change these credentials in production!');

    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

initializeAdmin();
