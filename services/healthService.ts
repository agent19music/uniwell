import * as HealthConnect from 'expo-health-connect';

export const healthService = {
  async requestPermissions() {
    try {
      const { granted } = await HealthConnect.requestPermissionAsync([
        HealthConnect.HealthConnectPermissionType.SLEEP
      ]);
      return granted;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  },

  async getSleepData(startDate: Date, endDate: Date) {
    try {
      const result = await HealthConnect.readRecordsAsync(
        HealthConnect.ReadRecordsOptions.SleepSession,
        { startDate, endDate }
      );
      
      return result.map(record => ({
        startDate: record.startTime,
        endDate: record.endTime,
        duration: (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / (1000 * 60 * 60)
      }));
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw error;
    }
  }
}; 