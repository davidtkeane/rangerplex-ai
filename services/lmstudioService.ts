
import { Message, Attachment, DocumentChunk, ModelParams } from "../types";
import { streamOpenAIResponse } from './openaiService';

/**
 * LM Studio Service
 *
 * LM Studio provides an OpenAI-compatible API for running local models.
 * This service wraps the OpenAI service with LM Studio-specific configuration.
 *
 * Default LM Studio setup:
 * - Base URL: http://localhost:1234/v1
 * - No API key required (local server)
 * - Supports OpenAI chat completions format
 * - Supports streaming responses
 */

/**
 * Stream chat response from LM Studio server
 *
 * @param prompt - User's current prompt
 * @param attachments - Any attached images/files
 * @param history - Conversation history
 * @param baseUrl - LM Studio server URL (e.g., http://localhost:1234/v1)
 * @param modelId - Model identifier (e.g., "mistral-7b-instruct")
 * @param context - Document chunks for RAG
 * @param onChunk - Callback for streaming text chunks
 * @param modelParams - Optional model parameters (temperature, etc.)
 * @returns Response with text and token usage
 */
export const streamLMStudioResponse = async (
  prompt: string,
  attachments: Attachment[],
  history: Message[],
  baseUrl: string,
  modelId: string,
  context: DocumentChunk[],
  onChunk: (text: string) => void,
  modelParams?: ModelParams
) => {
  // LM Studio doesn't require an API key for local usage
  // We pass a dummy value since the OpenAI service expects one
  const apiKey = "not-needed";

  // Debug logging
  console.log('🤖 LM Studio Request:', {
    baseUrl,
    modelId,
    modelIdType: typeof modelId,
    modelIdLength: modelId?.length,
    prompt: prompt.substring(0, 50) + '...'
  });

  // Validate model ID
  if (!modelId || modelId.trim() === '') {
    throw new Error('LM Studio Error: Model ID is empty. Please select a model from the dropdown.');
  }

  try {
    // Use the OpenAI service with LM Studio's base URL
    return await streamOpenAIResponse(
      prompt,
      attachments,
      history,
      modelId,
      context,
      apiKey,
      onChunk,
      modelParams,
      baseUrl  // Custom base URL points to LM Studio
    );
  } catch (error: any) {
    // Enhanced error messages for common LM Studio issues
    if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
      throw new Error('LM Studio Error: Cannot connect to server. Make sure:\n1. LM Studio app is open\n2. A model is LOADED (not just downloaded)\n3. Server is running on port 1234\n4. Base URL is set to http://localhost:1234/v1');
    }
    if (error.message?.includes('model') && error.message?.includes('not found')) {
      throw new Error(`LM Studio Error: Model "${modelId}" not found. Please load a model in LM Studio first.`);
    }
    if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
      throw new Error('LM Studio Error: Invalid request. Make sure a model is loaded in LM Studio.');
    }

    // Pass through other errors with LM Studio context
    throw new Error(`LM Studio Error: ${error.message}`);
  }
};

/**
 * Fetch available models from LM Studio server
 *
 * @param baseUrl - LM Studio server URL (e.g., http://localhost:1234/v1)
 * @returns Array of model identifiers
 */
export const fetchLMStudioModels = async (baseUrl: string): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl}/models`);

    if (!response.ok) {
      console.warn(`LM Studio returned ${response.status}: ${response.statusText}`);
      return []; // Return empty array instead of throwing
    }

    const data = await response.json();

    // OpenAI-compatible format returns { data: [{ id: "model-name" }, ...] }
    const models = data.data?.map((m: any) => m.id) || [];

    if (models.length === 0) {
      console.warn('LM Studio: No models loaded. Load a model in LM Studio to see it here.');
    }

    return models;
  } catch (error) {
    console.error("Error fetching LM Studio models:", error);
    return []; // Return empty array on network error
  }
};

/**
 * Check if LM Studio server is running and has a model loaded
 *
 * @param baseUrl - LM Studio server URL (e.g., http://localhost:1234/v1)
 * @returns True if server is accessible AND a model is loaded, false otherwise
 */
export const checkLMStudioConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn('LM Studio server not accessible');
      return false;
    }

    const data = await response.json();
    const models = data.data?.map((m: any) => m.id) || [];

    if (models.length === 0) {
      console.warn('LM Studio server running but no models loaded');
      return false;
    }

    console.log(`LM Studio: Connected! Found ${models.length} loaded model(s):`, models);
    return true;
  } catch (error) {
    console.error("LM Studio connection check failed:", error);
    return false;
  }
};
