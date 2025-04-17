/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from 'zustand';
import { StreamingLog } from './types';

interface StoreLoggerState {
  maxLogs: number;
  logs: StreamingLog[];
  addLog: (log: StreamingLog) => void;
  clearLogs: () => void;
}

/**
 * Zustand store for managing application logs.
 * Provides functionality to add, clear, and maintain a fixed-size log history.
 */
export const useLoggerStore = create<StoreLoggerState>((set) => ({
  // Maximum number of logs to keep in memory
  maxLogs: 1000,
  // Array of log entries
  logs: [],
  // Add a new log entry, maintaining the maximum size limit
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log].slice(-state.maxLogs),
    })),
  // Clear all logs from the store
  clearLogs: () => set({ logs: [] }),
}));
