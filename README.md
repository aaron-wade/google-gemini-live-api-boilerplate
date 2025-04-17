# Google Multimodal Live API - Boilerplate

A fork of [google-gemini/live-api-web-console](https://github.com/google-gemini/live-api-web-console)

## Contents

- [About](#about)
- [Local development setup](#local-development-setup)
- [Creating your own app](#creating-your-own-app)

## About

This repository contains a React-based starter app for using Google's [Multimodal Live API](https://ai.google.dev/api/multimodal-live) via WebSocket. It provides a foundation for building applications that leverage low-latency bidirectional voice and video interactions with Gemini, Google's flagship AI model.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). The architecture consists of:

- An event-emitting WebSocket client to ease communication between the Websocket and the frontend
- A communication layer for processing audio input and output
- A splitscreen console-canvas view for viewing logs and starting to build your own apps

## Local development setup

**Step 1:**
[Obtain a free Gemini API key](https://aistudio.google.com/apikey).

**Step 2:**
Add your API key to the `.env` file.

**Step 3:**
In your terminal, navigate to the directory containing this README.

**Step 4:**
Install dependencies and start the development server:

```bash
npm install && npm start
```

## Creating your own app

This starter app provides a foundation for building custom applications that leverage the Live API's capabilities. Below are instructions for how to create your own app and render it in the canvas area next to the console.

### 1. Create a new React component

Create a new React component for your app in the `src/components` directory. Your component should:

- Import necessary dependencies from `@google/genai`
- Use the `useLiveAPIContext` hook to access the Live API client
- Define any custom tools your app needs
- Handle tool calls and responses
- Manage your app's state

Example structure:

```typescript
import {
  LiveServerToolCall,
  LiveClientToolResponse,
  Modality,
  Tool,
  Type,
} from '@google/genai';

import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { LiveSessionConfig } from '../../lib/types';

interface FunctionResponse {
  id: string;
  name: string;
  response: { result: object };
}

// Define tools that the Live API will be able to invoke
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'yourCustomFunction',
        description: 'Description of what your function does',
        parameters: {
          type: Type.OBJECT,
          properties: {
            requiredParam1: {
              type: Type.STRING,
              description: 'A required string parameter that describes...',
            },
            requiredParam2: {
              type: Type.INTEGER,
              description: 'A required number parameter that represents...',
            },
            optionalParam1: {
              type: Type.STRING,
              description: 'An optional string parameter that specifies...',
            },
            optionalParam2: {
              type: Type.STRING,
              description:
                'An optional parameter that must be one of the specified values',
              enum: ['value1', 'value2', 'value3'],
            },
          },
          required: ['requiredParam1', 'requiredParam2'],
        },
      },
      {
        name: 'anotherFunction',
        description: 'Another function that does something different',
        parameters: {
          type: Type.OBJECT,
          properties: {
            // Parameters for this function
          },
          required: [
            // Specify names of required parameters for this function
          ],
        },
      },
    ],
  },
];

function YourCustomApp() {
  // Live API context and state management
  const { client, connected, setConfig } = useLiveAPIContext();

  // State for tool responses
  const [toolResponse, setToolResponse] = useState<LiveClientToolResponse | null>(null);

  const yourCustomFunction = (args: {
    requiredParam1: string;
    requiredParam2: number;
    optionalParam1?: string;
    optionalParam2?: 'value1' | 'value2' | 'value3';
  }) => {
    // Implementation logic
    // ...
  };

  const anotherFunction = (args: {
    // Parameters for this function
  }) => {
    // Implementation logic
    // ...
  };

  // INSERT CODE FOR STEPS 2-5 (BELOW) HERE

  return (/* Markdown for your component as JSX */);
}
```

### 2. Configure the Live API

In your component, configure the Live API using the `setConfig` function:

```typescript
useEffect(() => {
  setConfig({
    model: 'models/gemini-2.0-flash-live-001',
    generationConfig: {
      responseModalities: [Modality.AUDIO], // Or other modalities
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
    systemInstruction: {
      parts: [
        {
          text: 'Your system instructions',
        },
      ],
    },
    tools: tools,
  } as LiveSessionConfig);
}, [setConfig]);
```

### 3. Handle connection state

You may want to add handling to manage the application state when the Live API connects or disconnects:

```typescript
// Optional: Perform setup when connected
useEffect(() => {
  const initialize = async () => {
    if (!connected) return;

    // Insert setup logic here

    // Send an initial message to the model, if desired
    client.send(
      {
        text: 'Initial message',
      },
      true
    );
  };

  initialize();
}, [client, connected]);

// Optional: Perform cleanup when disconnected
useEffect(() => {
  if (!connected) {
    // Insert cleanup logic here
  }
}, [connected]);
```

### 4. Handle tool calls

Implement handling to process tool calls from the Live API:

```typescript
useEffect(() => {
  if (!connected) return;

  const onToolCall = (toolCall: LiveServerToolCall) => {
    const functionCalls = toolCall.functionCalls || [];
    const functionResponses: FunctionResponse[] = [];

    if (functionCalls.length > 0) {
      functionCalls.forEach(async (functionCall) => {
        let functionResponse: FunctionResponse | null = null;

        switch (functionCall.name) {
          case 'yourCustomFunction': {
            try {
              // Type assertion for function arguments
              const args = functionCall.args as {
                requiredParam1: string;
                requiredParam2: number;
                optionalParam1?: string;
                optionalParam2?: 'value1' | 'value2' | 'value3';
              };

              // Call function with provided arguments
              const result = yourCustomFunction(args);

              functionResponse = {
                id: functionCall.id || '',
                name: functionCall.name,
                response: result
                  ? {
                      result: result,
                    }
                  : { result: { success: true } },
              };
            } catch (error) {
              console.error(
                `An error occurred during execution of function ${functionCall.name}:`,
                error
              );
              functionResponse = {
                id: functionCall.id || '',
                name: functionCall.name,
                response: {
                  result: {
                    error: `Failed to execute function ${functionCall.name}`,
                  },
                },
              };
            }
            break;
          }
          case 'anotherFunction': {
            try {
              // Insert logic here
            } catch (error) {
              // Handle errors
            }
            break;
          }
          default:
            functionResponse = {
              id: functionCall.id || '',
              name: functionCall.name,
              response: {
                result: { error: `Unknown function: ${functionCall.name}` },
              },
            };
        }

        if (functionResponse) {
          functionResponses.push(functionResponse);
        }
      });

      const toolResponse: LiveClientToolResponse = {
        functionResponses: functionResponses,
      };
      setToolResponse(toolResponse);
    }
  };

  client.on('toolcall', onToolCall);
  return () => {
    client.off('toolcall', onToolCall);
  };
}, [client, connected]);
```

### 5. Send tool responses back to the model

After processing tool calls, send the responses back to the model:

```typescript
useEffect(() => {
  if (toolResponse && connected) {
    client.sendToolResponse(toolResponse);
    setToolResponse(null);
  }
}, [toolResponse, client, connected]);
```

### 6. Add your component to `App.tsx`

To display your component in the canvas area next to the console, add your component to `App.tsx`. The file contains a `<div>` element with the class `main-app-area` where you should insert your component:

```tsx
// In App.tsx
<div className="main-app-area">
  <YourCustomApp />
</div>
```
