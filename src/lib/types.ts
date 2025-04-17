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

import type {
  ContentUnion,
  GenerateContentConfig,
  LiveServerContent,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  ToolListUnion,
} from '@google/genai';

// TYPES

// See: https://ai.google.dev/api/live#session-configuration
export type LiveSessionConfig = {
  model: string;
  generationConfig?: Pick<
    GenerateContentConfig,
    | 'candidateCount'
    | 'frequencyPenalty'
    | 'maxOutputTokens'
    | 'mediaResolution'
    | 'presencePenalty'
    | 'responseModalities'
    | 'speechConfig'
    | 'temperature'
    | 'topK'
    | 'topP'
  >;
  systemInstruction?: ContentUnion;
  tools?: ToolListUnion;
};

/**
 * Defines the available filter types for the logger component.
 * - 'conversations': Shows only conversation-related logs
 * - 'tools': Shows only tool-related logs
 * - 'none': Shows all logs without filtering
 */
export type LoggerFilterType = 'conversations' | 'tools' | 'none';

/**
 * Configuration object for establishing a connection with the Live API.
 */
export type MultimodalLiveAPIClientConnection = {
  // API key for authentication
  apiKey: string;
  // Optional WebSocket URL. If not provided, defaults to the standard endpoint
  url?: string;
};

// INTERFACES

/**
 * Props interface for the Logger component.
 */
export interface LoggerProps {
  // Current filter setting for log display
  filter: LoggerFilterType;
}

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific WebSocket message or client state change.
 */
export interface MultimodalLiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the WebSocket connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the WebSocket connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
}

/**
 * State interface for the logger store.
 * Manages the collection and display of log entries.
 */
export interface StoreLoggerState {
  // Adds a new log entry to the store
  addLog: (log: StreamingLog) => void;
  // Clears all logs from the store
  clearLogs: () => void;
  // Array of current log entries
  logs: StreamingLog[];
  // Maximum number of logs to retain in the store
  maxLogs: number;
}

/**
 * Represents a single log entry in the system.
 * Used for tracking and displaying system events, messages, and errors.
 */
export interface StreamingLog {
  // Optional count for repeated log entries
  count?: number;
  // Optional additional data associated with the log
  data?: unknown;
  // Timestamp of when the log was created
  date: Date;
  // The log message content
  message: string | object;
  // The type/category of the log entry
  type: string;
}
