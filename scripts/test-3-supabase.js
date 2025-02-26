// Test 3: Test Supabase connection
console.log('Test 3: Testing Supabase connection');

try {
  const { supabase } = require('../lib/supabase');
  console.log('✅ Supabase import successful');
  
  // Test a simple query
  async function testSupabase() {
    const { data, error } = await supabase.from('categories').select('count');
    if (error) {
      console.error('❌ Supabase query failed:', error.message);
    } else {
      console.log('✅ Supabase query successful:', data);
    }
  }
  
  testSupabase();
} catch (error) {
  console.error('❌ Supabase import failed:', error.message);
} 