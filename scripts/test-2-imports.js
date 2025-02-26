// Test 2: Test basic imports
console.log('Test 2: Testing imports');

try {
  const dotenv = require('dotenv');
  console.log('✅ dotenv import successful');
  dotenv.config();
  console.log('✅ dotenv.config() successful');
} catch (error) {
  console.error('❌ dotenv import failed:', error.message);
}

try {
  const tsNode = require('ts-node');
  console.log('✅ ts-node import successful');
} catch (error) {
  console.error('❌ ts-node import failed:', error.message);
} 