import cron from 'node-cron';
import { updateResources } from './update-resources';

// Schedule daily update at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled daily resource update...');
  try {
    await updateResources();
    console.log('Daily resource update completed successfully');
  } catch (error) {
    console.error('Error in daily resource update:', error);
  }
});

// Schedule quick update every 6 hours for recent content
cron.schedule('0 */6 * * *', async () => {
  console.log('Running quick resource update...');
  try {
    await updateResources();
    console.log('Quick resource update completed successfully');
  } catch (error) {
    console.error('Error in quick resource update:', error);
  }
});

console.log('Resource update scheduler started');
console.log('Daily updates scheduled for 2 AM');
console.log('Quick updates scheduled every 6 hours');

// Keep the process running
process.on('SIGINT', () => {
  console.log('Scheduler stopped');
  process.exit(0);
}); 