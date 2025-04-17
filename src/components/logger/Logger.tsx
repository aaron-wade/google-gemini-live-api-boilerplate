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

import './logger.scss';

import { Part, Content } from '@google/genai';
import cn from 'classnames';
import { ReactNode } from 'react';
import { useLoggerStore } from '../../lib/store-logger';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { StreamingLog } from '../../lib/types';
import { isPlainObject } from '../../lib/utils';
import {
  LiveClientContent,
  LiveServerContent,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  LiveClientToolResponse,
} from '@google/genai';

const formatTime = (d: Date) => d.toLocaleTimeString().slice(0, -3);

const LogEntry = ({
  log,
  MessageComponent,
}: {
  log: StreamingLog;
  MessageComponent: ({
    message,
  }: {
    message: StreamingLog['message'];
  }) => ReactNode;
}): JSX.Element => (
  <li
    className={cn(
      `plain-log`,
      `source-${log.type.slice(0, log.type.indexOf('.'))}`,
      {
        receive: log.type.includes('receive'),
        send: log.type.includes('send'),
      }
    )}
  >
    <span className="timestamp">{formatTime(log.date)}</span>
    <span className="source">{log.type}</span>
    <span className="message">
      <MessageComponent message={log.message} />
    </span>
    {log.count && <span className="count">{log.count}</span>}
  </li>
);

const PlainTextMessage = ({
  message,
}: {
  message: StreamingLog['message'];
}) => <span>{message as string}</span>;

type Message = { message: StreamingLog['message'] };

const AnyMessage = ({ message }: Message) => (
  <pre>{JSON.stringify(message, null, '  ')}</pre>
);

function tryParseCodeExecutionResult(output: string | undefined): string {
  if (!output) return '';
  try {
    const json = JSON.parse(output);
    return JSON.stringify(json, null, '  ');
  } catch (e) {
    return output;
  }
}

const RenderPart = ({ part }: { part: Part }) => {
  if (part.text && part.text.length) {
    return <p className="part part-text">{part.text}</p>;
  }
  if (part.executableCode) {
    const language = part.executableCode.language?.toLowerCase() || 'text';
    return (
      <div className="part part-executableCode">
        <h5>executableCode: {part.executableCode.language}</h5>
        <SyntaxHighlighter
          language={language}
          style={dark}
          customStyle={{ padding: '1em' }}
        >
          {[part.executableCode.code] as string[]}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (part.codeExecutionResult) {
    return (
      <div className="part part-codeExecutionResult">
        <h5>codeExecutionResult: {part.codeExecutionResult.outcome}</h5>
        <SyntaxHighlighter
          language="json"
          style={dark}
          customStyle={{ padding: '1em' }}
        >
          {
            [
              tryParseCodeExecutionResult(part.codeExecutionResult.output),
            ] as string[]
          }
        </SyntaxHighlighter>
      </div>
    );
  }
  return (
    <div className="part part-inlinedata">
      <h5>Inline Data: {part.inlineData?.mimeType}</h5>
    </div>
  );
};

const ClientContentLog = ({ message }: Message) => {
  const content = message as LiveClientContent;
  if (!content.turns) return null;

  return (
    <div className="rich-log client-content user">
      <h4 className="roler-user">User</h4>
      {content.turns.map((turn: Content, i: number) => (
        <div key={`message-turn-${i}`}>
          {turn.parts
            ?.filter((part: Part) => !(part.text && part.text === '\n'))
            .map((part: Part, j: number) => (
              <RenderPart part={part} key={`message-turh-${i}-part-${j}`} />
            ))}
        </div>
      ))}
      {!content.turnComplete ? <span>turnComplete: false</span> : ''}
    </div>
  );
};

const ToolCallLog = ({ message }: Message) => {
  const { toolCall } = message as { toolCall: LiveServerToolCall };
  if (!toolCall?.functionCalls) return null;

  return (
    <div className={cn('rich-log tool-call')}>
      {toolCall.functionCalls.map((fc, i) => (
        <div key={fc.id} className="part part-functioncall">
          <h5>Function call: {fc.name}</h5>
          <SyntaxHighlighter
            language="json"
            style={dark}
            customStyle={{ padding: '1em' }}
          >
            {[JSON.stringify(fc, null, '  ')] as string[]}
          </SyntaxHighlighter>
        </div>
      ))}
    </div>
  );
};

const ToolCallCancellationLog = ({ message }: Message): JSX.Element => {
  const { toolCallCancellation } = message as {
    toolCallCancellation: LiveServerToolCallCancellation;
  };
  if (!toolCallCancellation?.ids)
    return <div className={cn('rich-log tool-call-cancellation')} />;

  return (
    <div className={cn('rich-log tool-call-cancellation')}>
      <span>
        {' '}
        ids:{' '}
        {toolCallCancellation.ids.map((id) => (
          <span className="inline-code" key={`cancel-${id}`}>
            "{id}"
          </span>
        ))}
      </span>
    </div>
  );
};

const ToolResponseLog = ({ message }: Message): JSX.Element => {
  const { toolResponse } = message as { toolResponse: LiveClientToolResponse };
  if (!toolResponse?.functionResponses)
    return <div className={cn('rich-log tool-response')} />;

  return (
    <div className={cn('rich-log tool-response')}>
      {toolResponse.functionResponses.map((fc) => (
        <div key={`tool-response-${fc.id}`} className="part">
          <h5>Function Response: {fc.id}</h5>
          <SyntaxHighlighter
            language="json"
            style={dark}
            customStyle={{ padding: '1em' }}
          >
            {[JSON.stringify(fc.response, null, '  ')] as string[]}
          </SyntaxHighlighter>
        </div>
      ))}
    </div>
  );
};

const ModelTurnLog = ({ message }: Message): JSX.Element => {
  const { serverContent } = message as { serverContent: LiveServerContent };
  if (!serverContent?.modelTurn?.parts) {
    return (
      <div className="rich-log model-turn model">No content available</div>
    );
  }

  return (
    <div className="rich-log model-turn model">
      <h4 className="role-model">Model</h4>
      {serverContent.modelTurn.parts
        .filter((part: Part) => !(part.text && part.text === '\n'))
        .map((part: Part, j: number) => (
          <RenderPart part={part} key={`model-turn-part-${j}`} />
        ))}
    </div>
  );
};

const CustomPlainTextLog = (msg: string) => () =>
  <PlainTextMessage message={msg} />;

export type LoggerFilterType = 'conversations' | 'tools' | 'none';

export type LoggerProps = {
  filter: LoggerFilterType;
};

const isToolCallMessage = (
  message: any
): message is { toolCall: LiveServerToolCall } =>
  isPlainObject(message) &&
  'toolCall' in message &&
  message.toolCall?.functionCalls !== undefined;

const isToolResponseMessage = (
  message: any
): message is { toolResponse: LiveClientToolResponse } =>
  isPlainObject(message) &&
  'toolResponse' in message &&
  message.toolResponse?.functionResponses !== undefined;

const isToolCallCancellationMessage = (
  message: any
): message is { toolCallCancellation: LiveServerToolCallCancellation } =>
  isPlainObject(message) &&
  'toolCallCancellation' in message &&
  message.toolCallCancellation?.ids !== undefined;

const isClientContentMessage = (message: any): message is LiveClientContent =>
  isPlainObject(message) && 'turns' in message && Array.isArray(message.turns);

const isServerContentMessage = (
  message: any
): message is { serverContent: LiveServerContent } =>
  isPlainObject(message) &&
  'serverContent' in message &&
  message.serverContent !== undefined;

const isInterrupted = (serverContent: any): boolean =>
  isPlainObject(serverContent) && 'interrupted' in serverContent;

const isTurnComplete = (serverContent: any): boolean =>
  isPlainObject(serverContent) && 'turnComplete' in serverContent;

const isModelTurn = (serverContent: any): boolean =>
  isPlainObject(serverContent) &&
  'modelTurn' in serverContent &&
  serverContent.modelTurn?.parts !== undefined;

const filters: Record<LoggerFilterType, (log: StreamingLog) => boolean> = {
  tools: (log: StreamingLog) =>
    isToolCallMessage(log.message) ||
    isToolResponseMessage(log.message) ||
    isToolCallCancellationMessage(log.message),
  conversations: (log: StreamingLog) =>
    isClientContentMessage(log.message) || isServerContentMessage(log.message),
  none: () => true,
};

const component = (log: StreamingLog) => {
  if (typeof log.message === 'string') {
    return PlainTextMessage;
  }
  if (isClientContentMessage(log.message)) {
    return ClientContentLog;
  }
  if (isToolCallMessage(log.message)) {
    return ToolCallLog;
  }
  if (isToolCallCancellationMessage(log.message)) {
    return ToolCallCancellationLog;
  }
  if (isToolResponseMessage(log.message)) {
    return ToolResponseLog;
  }
  if (isServerContentMessage(log.message)) {
    const { serverContent } = log.message;
    if (isInterrupted(serverContent)) {
      return CustomPlainTextLog('interrupted');
    }
    if (isTurnComplete(serverContent)) {
      return CustomPlainTextLog('turnComplete');
    }
    if (isModelTurn(serverContent)) {
      return ModelTurnLog;
    }
  }
  return AnyMessage;
};

export default function Logger({ filter = 'none' }: LoggerProps) {
  const { logs } = useLoggerStore();

  const filterFn = filters[filter];

  return (
    <div className="logger">
      <ul className="logger-list">
        {logs.filter(filterFn).map((log, key) => {
          return (
            <LogEntry MessageComponent={component(log)} log={log} key={key} />
          );
        })}
      </ul>
    </div>
  );
}
