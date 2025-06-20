import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { getModelConfig, AIModel } from '@/lib/models';
import { getConversationStyleConfig, ConversationStyle, DEFAULT_CONVERSATION_STYLE } from '@/lib/conversationStyles';
import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, conversationStyle, userApiKey, model, userId, isGuest } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use the provided model or default to OpenAI 4.1 Mini Search
    // Only allow search models for web search
    const allowedSearchModels = ['OpenAI 4.1 Mini Search', 'Gemini 2.5 Flash Search'];
    const searchModel = model && allowedSearchModels.includes(model) ? model : 'OpenAI 4.1 Mini Search';
    const modelConfig = getModelConfig(searchModel);

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Web search model not available' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guest users cannot use web search - block access
    if (isGuest) {
      return new Response(
        JSON.stringify({
          error: 'Web search is not available for guest users. Please sign up to use this feature.',
          code: 'GUEST_WEB_SEARCH_RESTRICTED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user can use this web search model (tier validation)
    const usingBYOK = !!userApiKey;

    const tierValidation = await canUserUseModel(searchModel as AIModel, usingBYOK, userId, isGuest);

    if (!tierValidation.canUseModel) {
      return new Response(
        JSON.stringify({
          error: tierValidation.message || 'Web search model access denied',
          code: 'TIER_LIMIT_EXCEEDED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Consume credits before making the API call
    const creditsConsumed = await consumeCredits(searchModel as AIModel, usingBYOK, userId, isGuest);
    if (!creditsConsumed && !usingBYOK) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for web search',
          code: 'INSUFFICIENT_CREDITS'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔍 Web search credits consumed for user ${userId} using model ${searchModel}`);

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add your API key in Settings → Application.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create OpenRouter client with web search enabled model
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': 'https://avchat.ayush-sharma.in/',
        'X-Title': 'AVChat - AI Chat Application',
        'User-Agent': 'AVChat/1.0.0'
      }
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Get conversation style configuration
    const styleConfig = getConversationStyleConfig(
      (conversationStyle as ConversationStyle) || DEFAULT_CONVERSATION_STYLE
    );

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.log('error', error);
      },
      system: `
      ${styleConfig.systemPrompt}

      You are AVChat, an ai assistant that can answer questions and help with tasks.
      You have access to real-time web search capabilities through Google Search.
      When answering questions, use the most up-to-date information available from web search.
      Be helpful and provide relevant information with proper citations.
      Be respectful and polite in all interactions.
      Always use LaTeX for mathematical expressions -
      Inline math must be wrapped in single dollar signs: $content$
      Display math must be wrapped in double dollar signs: $$content$$
      Display math should be placed on its own line, with nothing else on that line.
      Do not nest math delimiters or mix styles.
      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display:
      $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$

      When you use web search results, make sure to provide the source URLs in your response.
      `,
      experimental_transform: [smoothStream({ chunking: 'word' })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    console.log('error', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
