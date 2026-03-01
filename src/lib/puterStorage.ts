// Type declarations for Puter.js
declare global {
  interface Window {
    puter: {
      ai: {
        chat(prompt: string, options?: { model?: string; stream?: boolean }): Promise<string>;
        chat(prompt: string, image: string, options?: { model?: string; stream?: boolean }): Promise<string>;
        txt2img(
          prompt: string, 
          options?: { 
            model?: string; 
            input_image?: string;
            input_image_mime_type?: string;
          }
        ): Promise<HTMLImageElement>;
      };
      kv: {
        get(key: string): Promise<string | null>;
        set(key: string, value: string): Promise<void>;
        del(key: string): Promise<void>;
        list(): Promise<string[]>;
      };
    };
  }
}

const GEMINI_API_KEY = 'rinth_gemini_api_key';

// Helper to access puter from window
const getPuter = () => (globalThis.window === undefined ? undefined : globalThis.window.puter);

export const PuterStorage = {
  /**
   * Get the Gemini API key from Puter KV storage
   */
  async getApiKey(): Promise<string | null> {
    try {
      const puter = getPuter();
      if (!puter) return null;
      const key = await puter.kv.get(GEMINI_API_KEY);
      return key;
    } catch (error) {
      console.error('Failed to get API key from Puter:', error);
      return null;
    }
  },

  /**
   * Save the Gemini API key to Puter KV storage
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      const puter = getPuter();
      if (!puter) return false;
      await puter.kv.set(GEMINI_API_KEY, apiKey);
      return true;
    } catch (error) {
      console.error('Failed to save API key to Puter:', error);
      return false;
    }
  },

  /**
   * Delete the Gemini API key from Puter KV storage
   */
  async deleteApiKey(): Promise<boolean> {
    try {
      const puter = getPuter();
      if (!puter) return false;
      await puter.kv.del(GEMINI_API_KEY);
      return true;
    } catch (error) {
      console.error('Failed to delete API key from Puter:', error);
      return false;
    }
  },

  /**
   * Check if Puter is available
   */
  isAvailable(): boolean {
    const puter = getPuter();
    return puter !== undefined;
  }
};
