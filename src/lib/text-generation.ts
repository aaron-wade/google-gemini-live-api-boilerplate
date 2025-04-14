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
  FinishReason,
  GenerateContentRequest,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
  SafetySetting,
} from '@google/generative-ai';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

interface GenerateTextOptions {
  modelName: string;
  prompt: string;
  temperature?: number;
  safetySettings?: SafetySetting[];
}

/**
 * Generate text using the Gemini API.
 *
 * @param options - Configuration options for the generation request.
 * @returns The text content of the Gemini API response.
 */
export async function generateText(
  options: GenerateTextOptions
): Promise<string> {
  const {
    modelName,
    prompt,
    temperature = 0.75,
    safetySettings = DEFAULT_SAFETY_SETTINGS,
  } = options;

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing or empty');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  const parts: Part[] = [{ text: prompt }];

  const generationConfig = {
    temperature,
  };

  const request: GenerateContentRequest = {
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  };

  try {
    const result = await model.generateContent(request);
    const response = result.response;

    // Check for prompt blockage
    if (response.promptFeedback?.blockReason) {
      throw new Error(
        `Content generation failed: Prompt blocked (reason: ${response.promptFeedback.blockReason})`
      );
    }

    // Check for response blockage
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('Content generation failed: No candidates returned.');
    }

    const firstCandidate = response.candidates[0];

    // Check for finish reasons other than STOP
    if (
      firstCandidate.finishReason &&
      firstCandidate.finishReason !== FinishReason.STOP
    ) {
      if (firstCandidate.finishReason === FinishReason.SAFETY) {
        throw new Error(
          'Content generation failed: Response blocked due to safety settings.'
        );
      } else {
        throw new Error(
          `Content generation failed: Stopped due to ${firstCandidate.finishReason}.`
        );
      }
    }

    return response.text();
  } catch (error) {
    console.error(
      'An error occurred during Gemini API call or response processing:',
      error
    );
    throw error;
  }
}
