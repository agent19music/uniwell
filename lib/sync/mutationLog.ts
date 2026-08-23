import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { parseJsonOrNull } from '@/lib/contracts/json';

import { mutationRecordSchema, type MutationRecord, type MutationStatus } from './types';

const STORAGE_KEY = '@uniwell:mutation-log';
const recordsSchema = z.array(mutationRecordSchema);

class MutationLog {
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  async list(): Promise<MutationRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parseJsonOrNull(raw, (value) => recordsSchema.parse(value), 'mutation log') ?? [];
  }

  async enqueue(record: MutationRecord) {
    const records = await this.list();
    records.push(record);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.notify();
  }

  async update(id: string, patch: Partial<MutationRecord>) {
    const records = await this.list();
    const next = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.notify();
  }

  async remove(id: string) {
    const records = (await this.list()).filter((record) => record.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.notify();
  }

  async pending(): Promise<MutationRecord[]> {
    const records = await this.list();
    return records
      .filter((record) => record.status === 'pending' || record.status === 'failed' || record.status === 'syncing')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async byStatus(status: MutationStatus) {
    return (await this.list()).filter((record) => record.status === status);
  }
}

export const mutationLog = new MutationLog();
