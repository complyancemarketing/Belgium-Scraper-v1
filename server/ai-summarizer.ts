import axios from 'axios';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'HuLcVk8CUn31ea55tNzco4JQmJ0RhaVP';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-tiny'; // Fast and cheap model for summaries

interface SummaryRequest {
  title: string;
  content: string;
  url: string;
}

/**
 * Generate a summary of e-invoicing content using Mistral AI
 */
export async function generateSummary(request: SummaryRequest): Promise<string> {
  try {
    const prompt = `You are an expert in e-invoicing and tax regulations. Summarize the following content in 2-3 concise sentences.

IMPORTANT: Provide the summary ONLY in English, regardless of the source language (French, Dutch, German, etc.).

Title: ${request.title}
Content: ${request.content}

Provide a brief summary in clear, professional English. Focus on the main topic and key information. Keep it under 150 words.`;

    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: MISTRAL_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3, // Lower temperature for more focused summaries
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const summary = response.data.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      console.warn('Mistral AI returned empty summary, using fallback');
      return generateFallbackSummary(request.content);
    }

    return summary;
  } catch (error) {
    console.error('Error generating summary with Mistral AI:', error);
    // Fallback to simple text extraction if API fails
    return generateFallbackSummary(request.content);
  }
}

/**
 * Fallback summary generation using simple text extraction
 */
function generateFallbackSummary(content: string): string {
  // Extract first 200 characters and add ellipsis
  const cleaned = content.replace(/\s+/g, ' ').trim();
  const summary = cleaned.substring(0, 200);
  return summary + (cleaned.length > 200 ? '...' : '');
}

/**
 * Check if Mistral AI is available
 */
export function isMistralAvailable(): boolean {
  return !!MISTRAL_API_KEY && MISTRAL_API_KEY !== '';
}
