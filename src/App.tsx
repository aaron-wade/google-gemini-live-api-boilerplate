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

import { useRef, useState } from 'react';
import cn from 'classnames';

import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { LIVE_API_WEBSOCKET_URI } from './lib/constants';

import ControlTray from './components/control-tray/ControlTray';
import SidePanel from './components/side-panel/SidePanel';

import './App.scss';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error(
    'Missing required environment variable: REACT_APP_GEMINI_API_KEY'
  );
}

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  // Video element reference for displaying the active stream (webcam or screen capture)
  const videoRef = useRef<HTMLVideoElement>(null);

  // Current active stream state (null when no stream is active)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <div className="App">
      <LiveAPIProvider url={LIVE_API_WEBSOCKET_URI} apiKey={API_KEY}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              {/* Add your own app here */}
              <video
                className={cn('stream', {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
            >
              {/* Add your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
