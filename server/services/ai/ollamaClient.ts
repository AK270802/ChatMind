import { Trade } from "@shared/schema";

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaClient {
  private apiKey: string;
  private model: string;
  private siteUrl: string;
  private siteName: string;

  constructor(baseUrl: string = '', model: string = process.env.OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash') {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = model;
    this.siteUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    this.siteName = 'ChatMind';
  }

  async generateResponse(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.siteName,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          top_p: 0.9,
          include_reasoning: true
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      let content = choice.message.content;
      
      if (choice.message.reasoning) {
        content = `<reasoning>\n${choice.message.reasoning}\n</reasoning>\n\n${content}`;
      }
      
      return content;
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      // Fallback to mock response if API is not available
      return this.generateFallbackResponse(messages);
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  private generateFallbackResponse(messages: OllamaMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      const userContent = lastMessage.content.toLowerCase();
      
      if (userContent.includes('analyze') || userContent.includes('trading')) {
        return "Based on your trading patterns, I recommend focusing on risk management and maintaining discipline. Consider setting stricter stop-loss levels and reviewing your entry criteria.";
      }
      
      if (userContent.includes('improve') || userContent.includes('better')) {
        return "To improve your trading performance, I suggest keeping a detailed journal, analyzing your emotional state during trades, and learning from both winning and losing positions.";
      }
    }
    
    return "I'm here to help you improve your trading performance. Please provide more details about your trading activities or specific questions you'd like me to address.";
  }
}

export const ollamaClient = new OllamaClient();
