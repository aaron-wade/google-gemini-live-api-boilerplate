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

import {
  Content,
  Part,
  LiveServerContent,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  LiveClientContent,
  LiveClientRealtimeInput,
  LiveClientToolResponse,
  LiveClientMessage,
} from '@google/genai';
import { EventEmitter } from 'eventemitter3';
import { difference } from 'lodash';
import { blobToJSON, base64ToArrayBuffer } from './utils';
import { LiveSessionConfig, StreamingLog } from './types';
import { LIVE_API_WEBSOCKET_URI } from './constants';

/**
 * The events that can be emitted by the MultimodalLiveClient
 */
interface MultimodalLiveClientEventTypes {
  open: () => void;
  log: (log: StreamingLog) => void;
  close: (event: CloseEvent) => void;
  audio: (data: ArrayBuffer) => void;
  content: (data: LiveServerContent) => void;
  interrupted: () => void;
  setupcomplete: () => void;
  turncomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
}

/**
 * The connection configuration for the MultimodalLiveClient
 */
export type MultimodalLiveAPIClientConnection = {
  url?: string;
  apiKey: string;
};

/**
 * A WebSocket-based client for interacting with the Live API.
 * Extends EventEmitter to provide event-based communication between the client and application.
 * Handles connection management, message sending/receiving, and event dispatching.
 */
export class MultimodalLiveClient extends EventEmitter<MultimodalLiveClientEventTypes> {
  // Active WebSocket connection
  public ws: WebSocket | null = null;
  // Current client configuration
  protected config: LiveSessionConfig | null = null;
  // WebSocket endpoint URL
  public url: string = '';

  /**
   * Creates a new MultimodalLiveClient instance.
   * @param url - Optional WebSocket endpoint URL
   * @param apiKey - API key for authentication
   */
  constructor({ url, apiKey }: MultimodalLiveAPIClientConnection) {
    super();
    url = url || LIVE_API_WEBSOCKET_URI;
    url += `?key=${apiKey}`;
    this.url = url;

    this.send = this.send.bind(this);
  }

  public getConfig() {
    return { ...this.config };
  }

  /**
   * Establishes a WebSocket connection with the API server.
   * @param config - Client setup configuration
   * @returns Promise resolving to true if connection is successful
   */
  connect(config: LiveSessionConfig): Promise<boolean> {
    this.config = config;

    const ws = new WebSocket(this.url);

    ws.addEventListener('message', async (evt: MessageEvent) => {
      if (evt.data instanceof Blob) {
        this.receive(evt.data);
      } else {
        console.log('non blob message', evt);
      }
    });

    return new Promise((resolve, reject) => {
      const onError = (ev: Event) => {
        this.disconnect(ws);
        const message = `Could not connect to "${this.url}"`;
        this.log(`server.${ev.type}`, message);
        reject(new Error(message));
      };
      ws.addEventListener('error', onError);
      ws.addEventListener('open', (ev: Event) => {
        if (!this.config) {
          reject('Invalid config sent to `connect(config)`');
          return;
        }
        this.log(`client.${ev.type}`, `connected to socket`);
        this.emit('open');

        this.ws = ws;

        const setupMessage = {
          setup: this.config,
        };
        this._sendDirect(setupMessage);
        this.log('client.send', 'setup');

        ws.removeEventListener('error', onError);
        ws.addEventListener('close', (ev: CloseEvent) => {
          console.log(ev);
          this.disconnect(ws);
          let reason = ev.reason || '';
          if (reason.toLowerCase().includes('error')) {
            const prelude = 'ERROR]';
            const preludeIndex = reason.indexOf(prelude);
            if (preludeIndex > 0) {
              reason = reason.slice(
                preludeIndex + prelude.length + 1,
                Infinity
              );
            }
          }
          this.log(
            `server.${ev.type}`,
            `disconnected ${reason ? `with reason: ${reason}` : ``}`
          );
          this.emit('close', ev);
        });
        resolve(true);
      });
    });
  }

  /**
   * Disconnects from the WebSocket server.
   * @param ws - Optional WebSocket instance to disconnect
   * @returns true if disconnection was successful
   */
  disconnect(ws?: WebSocket) {
    if ((!ws || this.ws === ws) && this.ws) {
      this.ws.close();
      this.ws = null;
      this.log('client.close', `Disconnected`);
      return true;
    }
    return false;
  }

  /**
   * Processes incoming WebSocket messages.
   * @param blob - Binary message data
   */
  protected async receive(blob: Blob) {
    const response = (await blobToJSON(blob)) as any;
    if ('toolCall' in response) {
      this.log('server.toolCall', response);
      this.emit('toolcall', response.toolCall);
      return;
    }
    if ('toolCallCancellation' in response) {
      this.log('receive.toolCallCancellation', response);
      this.emit('toolcallcancellation', response.toolCallCancellation);
      return;
    }

    if ('setupComplete' in response) {
      this.log('server.send', 'setupComplete');
      this.emit('setupcomplete');
      return;
    }

    if ('serverContent' in response) {
      const { serverContent } = response;
      if ('interrupted' in serverContent) {
        this.log('receive.serverContent', 'interrupted');
        this.emit('interrupted');
        return;
      }
      if ('turnComplete' in serverContent) {
        this.log('server.send', 'turnComplete');
        this.emit('turncomplete');
      }

      if ('modelTurn' in serverContent) {
        let parts: Part[] = serverContent.modelTurn.parts;

        const audioParts = parts.filter((p) =>
          p.inlineData?.mimeType?.startsWith('audio/pcm')
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);

        const otherParts = difference(parts, audioParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });
        if (!otherParts.length) {
          return;
        }

        parts = otherParts;

        const content: LiveServerContent = { modelTurn: { parts } };
        this.emit('content', content);
        this.log(`server.content`, response);
      }
    } else {
      console.log('received unmatched message', response);
    }
  }

  /**
   * Sends realtime input data to the server.
   * @param chunks - Array of media chunks with MIME type and data
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    let hasAudio = false;
    let hasVideo = false;
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      if (ch.mimeType.includes('audio')) {
        hasAudio = true;
      }
      if (ch.mimeType.includes('image')) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
    const message =
      hasAudio && hasVideo
        ? 'audio + video'
        : hasAudio
        ? 'audio'
        : hasVideo
        ? 'video'
        : 'unknown';

    const realtimeInput: LiveClientRealtimeInput = {
      mediaChunks: chunks.map((chunk) => ({
        mimeType: chunk.mimeType,
        data: chunk.data,
      })),
    };

    const clientMessage: LiveClientMessage = {
      realtimeInput,
    };

    this._sendDirect(clientMessage);
    this.log(`client.realtimeInput`, message);
  }

  /**
   * Sends a tool response to the server.
   * @param toolResponse - Tool response data
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    const message = {
      toolResponse,
    };

    this._sendDirect(message);
    this.log(`client.toolResponse`, message);
  }

  /**
   * Sends content to the server.
   * @param parts - Content parts to send
   * @param turnComplete - Whether this completes the current turn
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    parts = Array.isArray(parts) ? parts : [parts];
    const content: Content = {
      role: 'user',
      parts,
    };

    const clientContentRequest: { clientContent: LiveClientContent } = {
      clientContent: {
        turns: [content],
        turnComplete,
      },
    };

    this._sendDirect(clientContentRequest);
    this.log(`client.send`, clientContentRequest.clientContent);
  }

  /**
   * Internal method to send data through the WebSocket connection.
   * @param request - Data to send
   * @throws Error if WebSocket is not connected
   */
  protected _sendDirect(request: object) {
    if (!this.ws) {
      throw new Error('WebSocket is not connected');
    }
    const str = JSON.stringify(request);
    this.ws.send(str);
  }

  /**
   * Internal method to emit a log event.
   * @param type - Log type
   * @param message - Log message
   */
  protected log(type: string, message: string | object) {
    this.emit('log', {
      type,
      message,
      date: new Date(),
    });
  }
}
