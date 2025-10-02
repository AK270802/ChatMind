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
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateResponse(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama API call failed:', error);
      // Fallback to mock response if Ollama is not available
      return this.generateFallbackResponse(messages);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
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
