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

const DEFAULT_HOST = 'generativelanguage.googleapis.com';

const DEFAULT_WEBSOCKET_ENDPOINT =
  'google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/**
 * Default WebSocket URI for the Live API
 */
export const LIVE_API_WEBSOCKET_URI = `wss://${DEFAULT_HOST}/ws/${DEFAULT_WEBSOCKET_ENDPOINT}`;

/**
 * Default Live API model to use
 */
export const DEFAULT_LIVE_API_MODEL = 'models/gemini-2.0-flash-live-001';
