import { EngineeringProject, GroundingSource } from "./types";

const BLOCKED_KEYWORDS = [
  "gun", "pistol", "rifle", "bomb", "grenade", "mine", "missile",
  "weapon", "taser", "stun gun", "explosive", "detonator", "trigger",
  "silencer", "ammunition", "firearm"
];

export class GeminiService {
  private static instance: GeminiService | null = null;
  private readonly maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  /**
   * Extract text from Puter.js AI response (handles multiple response formats)
   */
  private extractResponseText(response: any): string {
    // If it's already a string, return it
    if (typeof response === 'string') {
      return response;
    }
    
    // If it's an object with a message.content property (Puter.js format)
    if (response && typeof response === 'object') {
      // Puter.js format: response.message.content
      if (response.message && typeof response.message.content === 'string') {
        return response.message.content;
      }
      
      // Legacy/fallback formats
      if (typeof response.text === 'string') {
        return response.text;
      }
      if (typeof response.content === 'string') {
        return response.content;
      }
      if (typeof response.message === 'string') {
        return response.message;
      }
      if (typeof response.response === 'string') {
        return response.response;
      }
      if (typeof response.output === 'string') {
        return response.output;
      }
      if (typeof response.result === 'string') {
        return response.result;
      }
    }
    
    // Log the unexpected format and throw error
    console.error('Unable to extract text from Puter.ai.chat response:', {
      type: typeof response,
      value: response,
      keys: response && typeof response === 'object' ? Object.keys(response) : []
    });
    throw new Error('Invalid response format from AI service. Check console for details.');
  }

  private constructor() {
    // Check if Puter.js is available
    if (!globalThis.window?.puter?.ai) {
      throw new Error("Puter.js is not loaded. Make sure to include the Puter.js script in your HTML.");
    }
  }

  /**
   * Create a new GeminiService instance
   */
  static async create(): Promise<GeminiService> {
    return new GeminiService();
  }

  /**
   * Get or create singleton instance
   */
  static async getInstance(): Promise<GeminiService> {
    GeminiService.instance ??= await GeminiService.create();
    return GeminiService.instance;
  }

  /**
   * Reset the instance
   */
  static resetInstance(): void {
    GeminiService.instance = null;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error?.status === 503 || error?.code === 503)) {
        console.log(`Rate limited. Retrying in ${this.retryDelay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        // Exponential backoff
        this.retryDelay *= 2;
        return this.retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  }

  private containsBlockedKeyword(text: string | undefined | null): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return BLOCKED_KEYWORDS.some(word => lower.includes(word));
  }

  private async classifyQuery(query: string): Promise<"SAFE" | "WEAPON" | "OTHER"> {
    const response = await globalThis.window.puter.ai.chat(
      `Classify this request as SAFE_ELECTRONICS, WEAPON, or OTHER. Only output the category name in plain text.\nRequest: ${query}`,
      { model: 'gemini-3-flash-preview' }
    );

    const text = this.extractResponseText(response);
    const label = text.trim().toUpperCase();
    if (label.includes("WEAPON")) return "WEAPON";
    if (label.includes("SAFE")) return "SAFE";
    return "OTHER";
  }

  async generateProjectPlan(query: string): Promise<EngineeringProject> {
    // 1. Quick local keyword check
    if (this.containsBlockedKeyword(query)) {
      throw new Error("This project idea contains restricted terms. Raith only supports safe, educational hardware projects.");
    }

    // 2. AI-based safety classification
    const category = await this.retryWithBackoff(() => this.classifyQuery(query));
    if (category === "WEAPON") {
      throw new Error("Weapon-related projects are strictly prohibited on Raith.");
    }

    const prompt = `Generate a detailed engineering project plan for building: ${query}. 
Return ONLY a valid JSON object (no markdown, no code blocks, just pure JSON) with this exact structure:
{
  "title": "string",
  "description": "100 word description",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedTime": "string like '2-3 hours'",
  "estimatedCost": "string like '$20-40'",
  "components": [
    {"name": "component name", "purpose": "what it does"}
  ],
  "instructions": [
    {"step": 1, "description": "detailed instruction"}
  ],
  "code": {
    "language": "Arduino|Python|C++",
    "content": "full working code here"
  }
}

Ensure the project is safe, educational, and non-harmful. Include 3-4 technical tags, 5-10 components, and 8-15 detailed steps.`;

    const response = await this.retryWithBackoff(() =>
      globalThis.window.puter.ai.chat(prompt, { model: 'gemini-3-pro-preview' })
    );

    const text = this.extractResponseText(response);
    
    // Parse JSON from response (handle potential markdown wrappers)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.split('```json').join('').split('```').join('');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.split('```').join('');
    }

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse project plan JSON:', error);
      console.error('Response was:', jsonText);
      throw new Error('Failed to parse project plan. Please try again.');
    }
  }

  async generateProjectImage(title: string): Promise<string | undefined> {
    if (this.containsBlockedKeyword(title)) return undefined;

    try {
      // Use Puter.js's free Nano Banana (Gemini 2.5 Flash Image) API
      const prompt = `A high-quality 3D render of a DIY electronics hardware engineering project: ${title}. 
The dimensions should be 600px × 400px with technical lighting showing just the product and nothing else. 
Keep the background #1a1a1a dark and give it a 3D coordinate rendering look with professional studio lighting.`;

      // puter.ai.txt2img returns an HTMLImageElement
      const imageElement = await globalThis.window.puter.ai.txt2img(prompt, {
        model: 'gemini-2.5-flash-image-preview'
      });

      // Convert the image element to a data URL for use in components
      if (imageElement && imageElement instanceof HTMLImageElement) {
        // The image element from Puter already has a src (data URL or blob URL)
        return imageElement.src;
      }

      return undefined;
    } catch (error) {
      console.error('Failed to generate image:', error);
      return undefined;
    }
  }

  async findBuyingLinks(components: { name: string }[]): Promise<GroundingSource[]> {
    const componentList = components.slice(0, 5).map(c => c.name).join(", ");
    if (this.containsBlockedKeyword(componentList)) return [];

    try {
      const prompt = `For these engineering components: ${componentList}
      
Suggest direct shopping links from Adafruit, SparkFun, or Amazon. Return ONLY a JSON array (no markdown, no code blocks) with this structure:
[
  {"title": "Component Name - Retailer", "uri": "https://..."},
  {"title": "Another Component - Retailer", "uri": "https://..."}
]

Provide real, working URLs to products that match these components.`;

      const response = await this.retryWithBackoff(() =>
        globalThis.window.puter.ai.chat(prompt, { model: 'gemini-3-flash-preview' })
      );

      const text = this.extractResponseText(response);
      
      // Parse JSON from response
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.split('```json').join('').split('```').join('');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.split('```').join('');
      }

      try {
        const links = JSON.parse(jsonText);
        return Array.isArray(links) ? links : [];
      } catch (error) {
        console.error('Failed to parse buying links JSON:', error);
        return [];
      }
    } catch (error) {
      console.error('Failed to find buying links:', error);
      return [];
    }
  }

  async chatWithProject(project: EngineeringProject, userMessage: string, history: Array<{role: string, text: string}> = []): Promise<string> {
    // Create a concise project summary instead of full JSON
    const projectSummary = `Project: ${project.title}
Description: ${project.description}
Difficulty: ${project.difficulty}
Components: ${project.components?.slice(0, 10).map(c => c.name).join(', ') || 'N/A'}
Steps: ${project.instructions?.length || 0} total steps`;

    const systemContext = `You are the Raith Engineering Assistant helping with: ${project.title}.

${projectSummary}

Answer technical questions, suggest alternatives, explain steps, and help troubleshoot. Keep responses helpful and concise.
Refuse any request related to weapons or dangerous devices.`;

    // Build conversation history (keep last 6 messages to avoid token limits)
    let conversationHistory = '';
    if (history.length > 0) {
      const recentHistory = history.slice(-6);
      conversationHistory = recentHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n') + '\n';
    }

    const prompt = `${systemContext}

${conversationHistory}User: ${userMessage}
Assistant:`;

    try {
      const response = await globalThis.window.puter.ai.chat(prompt, { model: 'gemini-3-flash-preview' });
      return this.extractResponseText(response);
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error('Failed to get response from chat assistant');
    }
  }
}
