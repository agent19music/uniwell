import { supabase } from '../lib/supabase';
import { SleepRecord } from '../types/sleep';

export const sleepService = {
  calculateSleepQuality(record: SleepRecord): number {
    const totalDuration = record.deep_sleep_hours + record.light_sleep_hours + record.rem_sleep_hours;
    
    // Ideal proportions based on sleep science
    const idealDeepSleep = totalDuration * 0.2; // 20% deep sleep
    const idealRemSleep = totalDuration * 0.25; // 25% REM sleep
    
    // Calculate quality based on how close to ideal proportions
    const deepSleepScore = Math.min(100, (record.deep_sleep_hours / idealDeepSleep) * 100);
    const remSleepScore = Math.min(100, (record.rem_sleep_hours / idealRemSleep) * 100);
    
    // Duration score (optimal sleep duration is 7-9 hours)
    const durationScore = totalDuration >= 7 && totalDuration <= 9 ? 100 : 
      Math.max(0, 100 - Math.abs(8 - totalDuration) * 20);

    // Final quality score is weighted average
    const qualityScore = (deepSleepScore * 0.4) + (remSleepScore * 0.3) + (durationScore * 0.3);
    
    return Math.round(qualityScore);
  },

  async addSleepRecord(record: Omit<SleepRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sleep_records')
      .insert([{
        ...record,
        quality_rating: this.calculateSleepQuality(record as SleepRecord)
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecentSleepRecords(days: number = 7) {
    const { data, error } = await supabase
      .from('sleep_records')
      .select('*')
      .gte('sleep_start', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('sleep_start', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSleepStats(days: number = 7) {
    const records = await this.getRecentSleepRecords(days);
    
    if (!records.length) return null;

    const stats = records.reduce((acc, record) => {
      const duration = new Date(record.sleep_end).getTime() - new Date(record.sleep_start).getTime();
      const hours = duration / (1000 * 60 * 60);

      return {
        total_hours: acc.total_hours + hours,
        quality_rating: acc.quality_rating + record.quality_rating,
        deep_sleep_hours: acc.deep_sleep_hours + record.deep_sleep_hours,
        light_sleep_hours: acc.light_sleep_hours + record.light_sleep_hours,
        rem_sleep_hours: acc.rem_sleep_hours + record.rem_sleep_hours,
      };
    }, {
      total_hours: 0,
      quality_rating: 0,
      deep_sleep_hours: 0,
      light_sleep_hours: 0,
      rem_sleep_hours: 0,
    });

    return {
      ...stats,
      quality_rating: Math.round(stats.quality_rating / records.length),
    };
  }
}; 