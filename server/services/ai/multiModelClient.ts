import { Trade } from "@shared/schema";

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIModelClient {
  name: string;
  isAvailable(): Promise<boolean>;
  generateResponse(messages: AIMessage[]): Promise<AIResponse>;
}

export class OpenRouterClient implements AIModelClient {
  name = 'openrouter';
  private apiKey: string;
  private model: string;
  private siteUrl: string;
  private siteName: string;

  constructor(apiKey: string = process.env.OPENROUTER_API_KEY || '', 
              model: string = process.env.OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.siteUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    this.siteName = 'ChatMind';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
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
          include_reasoning: true // Request reasoning if available
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      
      // Handle reasoning details if present
      // Some models return reasoning_content, others might put it in content
      // The user asked to "Preserve reasoning details"
      let content = choice.message.content;
      
      // If there's reasoning content separate from main content, we might want to log it or include it
       if (choice.message.reasoning) {
         console.log('Reasoning details found');
         // Append reasoning to content to preserve it in conversation history
         content = `<reasoning>\n${choice.message.reasoning}\n</reasoning>\n\n${content}`;
       }
 
       return {
        content: content,
        model: this.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw new Error(`OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class OpenAIClient implements AIModelClient {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || '', 
              model: string = process.env.OPENAI_MODEL || 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model: this.model,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class GeminiClient implements AIModelClient {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || '', 
              model: string = process.env.GEMINI_MODEL || 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // Convert messages to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.candidates[0].content.parts[0].text,
        model: this.model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw new Error(`Gemini request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class MultiModelClient {
  private clients: AIModelClient[];
  private enabledModels: string[];

  constructor() {
    this.enabledModels = (process.env.AI_MODELS_ENABLED || 'openrouter,openai,gemini')
      .split(',')
      .map(model => model.trim().toLowerCase());
    
    this.clients = [
      new OpenRouterClient(),
      new OpenAIClient(),
      new GeminiClient()
    ].filter(client => this.enabledModels.includes(client.name));
  }

  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    const errors: string[] = [];

    for (const client of this.clients) {
      try {
        console.log(`Attempting to use ${client.name} model...`);
        
        // Check if client is available
        const isAvailable = await client.isAvailable();
        if (!isAvailable) {
          console.log(`${client.name} is not available, skipping...`);
          continue;
        }

        // Try to generate response with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await client.generateResponse(messages);
          clearTimeout(timeoutId);
          console.log(`Successfully generated response using ${client.name}`);
          return response;
        } catch (timeoutError) {
          clearTimeout(timeoutId);
          throw timeoutError;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to generate response with ${client.name}:`, errorMessage);
        errors.push(`${client.name}: ${errorMessage}`);
      }
    }

    // If all models failed, throw an error with details
    throw new Error(`All AI models failed. Errors: ${errors.join('; ')}`);
  }

  async getAvailableModels(): Promise<string[]> {
    const availableModels: string[] = [];
    
    for (const client of this.clients) {
      try {
        if (await client.isAvailable()) {
          availableModels.push(client.name);
        }
      } catch {
        // Skip unavailable models
      }
    }
    
    return availableModels;
  }
}

export const multiModelClient = new MultiModelClient();
