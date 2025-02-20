import * as HealthConnect from 'expo-health-connect';

export const healthService = {
  async requestPermissions() {
    try {
      const { granted } = await HealthConnect.requestPermissionAsync([
        HealthConnect.HealthConnectPermissionType.SLEEP,
        HealthConnect.HealthConnectPermissionType.SLEEP_STAGES
      ]);
      return granted;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  },

  async getSleepData(startDate: Date, endDate: Date) {
    try {
      // Get sleep sessions
      const sleepSessions = await HealthConnect.readRecordsAsync(
        HealthConnect.ReadRecordsOptions.SleepSession,
        { startDate, endDate }
      );

      // Get sleep stages for each session
      const sleepData = await Promise.all(
        sleepSessions.map(async (session) => {
          const stages = await HealthConnect.readRecordsAsync(
            HealthConnect.ReadRecordsOptions.SleepStage,
            {
              startDate: new Date(session.startTime),
              endDate: new Date(session.endTime)
            }
          );

          // Calculate duration for each sleep stage
          const stagesDuration = stages.reduce((acc, stage) => {
            const duration = (new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / (1000 * 60 * 60);
            switch (stage.stage) {
              case 'deep':
                acc.deep += duration;
                break;
              case 'light':
                acc.light += duration;
                break;
              case 'rem':
                acc.rem += duration;
                break;
            }
            return acc;
          }, { deep: 0, light: 0, rem: 0 });

          return {
            startDate: session.startTime,
            endDate: session.endTime,
            duration: (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60),
            sleepStages: stagesDuration
          };
        })
      );

      return sleepData;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw error;
    }
  }
}; 