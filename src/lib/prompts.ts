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

// Add any LLM prompts used by your application to this file.
// An example prompt is provided below.

const EXAMPLE_PROMPT_TEMPLATE = `Write me a poem about {topic}`;

const constructPromptFromTemplate = (
  template: string,
  replacements: Record<string, string>
): string => {
  return Object.entries(replacements).reduce(
    (acc, [placeholder, value]) => acc.replaceAll(`{${placeholder}}`, value),
    template
  );
};

export const constructExamplePrompt = (topic: string) => {
  return constructPromptFromTemplate(EXAMPLE_PROMPT_TEMPLATE, { topic });
};
