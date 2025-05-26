import { CronJob } from 'cron';
import { updateResources } from '@/supabase/functions/update-resources';

// Create a new cron job that runs every 24 hours
const job = new CronJob('0 0 * * *', async () => {
  console.log('Starting scheduled resource update...');
  try {
    await updateResources();
    console.log('Scheduled resource update completed successfully');
  } catch (error) {
    console.error('Error in scheduled resource update:', error);
  }
});

// Start the job
job.start();

console.log('Resource update scheduler started. Will run every 24 hours.');

// Keep the process running
process.on('SIGINT', () => {
  job.stop();
  process.exit();
}); 