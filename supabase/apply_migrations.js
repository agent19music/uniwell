const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const supabaseMigrationsDir = path.join(__dirname, 'migrations');
const fixMigrationFile = path.join(supabaseMigrationsDir, 'fix_therapist_rls.sql');

console.log('Starting migration application...');

try {
  // Get Supabase URL and service key from env or config
  const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';
  
  if (!SUPABASE_SERVICE_KEY.startsWith('eyJ') && SUPABASE_SERVICE_KEY === 'your-service-key') {
    console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is not set properly.');
    console.error('Please set the SUPABASE_SERVICE_KEY to your actual service role key before running this script.');
    process.exit(1);
  }
  
  // First check if the file exists
  if (!fs.existsSync(fixMigrationFile)) {
    console.error(`Migration file not found: ${fixMigrationFile}`);
    process.exit(1);
  }
  
  // Execute a PSQL command to apply the migration
  const psqlCommand = `
    PGPASSWORD="${SUPABASE_SERVICE_KEY}" psql -h ${new URL(SUPABASE_URL).hostname} -U postgres -d postgres -f "${fixMigrationFile}"
  `;
  
  console.log('Applying migration to fix therapist RLS policies...');
  execSync(psqlCommand, { stdio: 'inherit' });
  
  console.log('Migration applied successfully!');
  console.log('The following changes have been made:');
  console.log('1. Updated therapist_profiles table with necessary columns');
  console.log('2. Added an INSERT policy for therapist_profiles table');
  console.log('3. Fixed RLS policies for appointments');
  console.log('4. Added necessary triggers for timestamp updates');
  
} catch (error) {
  console.error('Error applying migrations:');
  console.error(error.message);
  process.exit(1);
} 