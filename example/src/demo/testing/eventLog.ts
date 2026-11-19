import { useSyncExternalStore } from 'react';

export interface ExampleEvent {
  id: number;
  time: Date;
  source: string;
  message: string;
}

const MAX_ENTRIES = 500;

/**
 * In-app log of the SDK callbacks and events the example app receives, shown
 * in the Events tab so callbacks can be checked on a device without a
 * debugger. Every entry is also logged to the console.
 */
export class ExampleEventLog {
  private entries: ExampleEvent[] = [];
  private listeners = new Set<() => void>();
  private nextId = 0;

  add(source: string, message: string) {
    console.log(`Host app: [${source}] ${message}`);
    this.entries = [
      { id: this.nextId++, time: new Date(), source, message },
      ...this.entries,
    ].slice(0, MAX_ENTRIES);
    this.listeners.forEach((listener) => listener());
  }

  clear() {
    this.entries = [];
    this.listeners.forEach((listener) => listener());
  }

  getEntries = (): ExampleEvent[] => this.entries;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

/** SDK callbacks and events, newest first. */
export const eventLog = new ExampleEventLog();

/** Analytics events of the SDK and CardLink, newest first. */
export const analyticsLog = new ExampleEventLog();

export function useEventLog(log: ExampleEventLog): ExampleEvent[] {
  return useSyncExternalStore(log.subscribe, log.getEntries);
}

export function describe(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
