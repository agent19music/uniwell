import { supabase } from '../lib/supabase';
import { SleepRecord } from '../types/sleep';

export const sleepService = {
  async addSleepRecord(record: Omit<SleepRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sleep_records')
      .insert([record])
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