/**
 * Secure Key Management System for VidLiSync
 * Implements secure storage and retrieval of API keys
 */

export interface SecureConfig {
  openai: string;
  stripe: string;
  googleTranslate: string;
  supabase: string;
  daily: string;
}

export class SecureKeyManager {
  private static instance: SecureKeyManager | null = null;
  private keyCache: Map<string, string> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }

  /**
   * Initialize the key manager with environment variables
   * All keys should come from secure environment variables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Validate all required environment variables are present
    const requiredKeys = [
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY', 
      'GOOGLE_TRANSLATE_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DAILY_API_KEY'
    ];

    const missingKeys = requiredKeys.filter(key => !process.env[key]);
    
    if (missingKeys.length > 0) {
      throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    }

    // Cache keys securely (only in memory, never persisted)
    this.keyCache.set('openai', process.env.OPENAI_API_KEY!);
    this.keyCache.set('stripe', process.env.STRIPE_SECRET_KEY!);
    this.keyCache.set('googleTranslate', process.env.GOOGLE_TRANSLATE_API_KEY!);
    this.keyCache.set('supabase', process.env.SUPABASE_SERVICE_ROLE_KEY!);
    this.keyCache.set('daily', process.env.DAILY_API_KEY!);

    this.initialized = true;
  }

  /**
   * Get a secure API key by name
   * Never logs or exposes the actual key value
   */
  async getKey(keyName: keyof SecureConfig): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const key = this.keyCache.get(keyName);
    if (!key) {
      throw new Error(`Key not found: ${keyName}`);
    }

    return key;
  }

  /**
   * Get OpenAI API key
   */
  async getOpenAIKey(): Promise<string> {
    return this.getKey('openai');
  }

  /**
   * Get Stripe secret key
   */
  async getStripeKey(): Promise<string> {
    return this.getKey('stripe');
  }

  /**
   * Get Google Translate API key
   */
  async getGoogleTranslateKey(): Promise<string> {
    return this.getKey('googleTranslate');
  }

  /**
   * Get Supabase service role key
   */
  async getSupabaseKey(): Promise<string> {
    return this.getKey('supabase');
  }

  /**
   * Get Daily.co API key
   */
  async getDailyKey(): Promise<string> {
    return this.getKey('daily');
  }

  /**
   * Validate that all keys are properly configured
   * Used for health checks
   */
  async validateConfiguration(): Promise<{valid: boolean; missing: string[]}> {
    try {
      await this.initialize();
      return { valid: true, missing: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const missing = message.includes('Missing required environment variables:') 
        ? message.split(':')[1].trim().split(', ')
        : [];
      return { valid: false, missing };
    }
  }

  /**
   * Clear all cached keys (for security)
   */
  clearCache(): void {
    this.keyCache.clear();
    this.initialized = false;
  }

  /**
   * Rotate keys - update environment and reinitialize
   * This would be called by a key rotation service
   */
  async rotateKeys(): Promise<void> {
    this.clearCache();
    await this.initialize();
  }
}

// Export singleton instance
export const keyManager = SecureKeyManager.getInstance();

// Type-safe key validation
export const validateApiKey = (key: string, type: string): boolean => {
  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{48,}$/,
    stripe: /^sk_(test|live)_[a-zA-Z0-9]{99,}$/,
    googleTranslate: /^AIza[a-zA-Z0-9_-]{35}$/,
    supabase: /^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*$/,
    daily: /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/
  };

  const pattern = patterns[type as keyof typeof patterns];
  return pattern ? pattern.test(key) : false;
};

// Security audit function
export const auditKeyConfiguration = async (): Promise<{
  secure: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const validation = await keyManager.validateConfiguration();
    
    if (!validation.valid) {
      issues.push(`Missing API keys: ${validation.missing.join(', ')}`);
      recommendations.push('Set all required environment variables');
    }

    // Check for development keys in production
    if (process.env.NODE_ENV === 'production') {
      if (process.env.STRIPE_SECRET_KEY?.includes('test')) {
        issues.push('Using test Stripe key in production');
        recommendations.push('Replace with live Stripe key');
      }
    }

    // Check key format validation
    const keyTypes = ['openai', 'stripe', 'googleTranslate', 'supabase', 'daily'] as const;
    for (const type of keyTypes) {
      try {
        const key = await keyManager.getKey(type);
        if (!validateApiKey(key, type)) {
          issues.push(`Invalid ${type} key format`);
          recommendations.push(`Verify ${type} key format`);
        }
      } catch {
        // Already handled in validation
      }
    }

    return {
      secure: issues.length === 0,
      issues,
      recommendations
    };

  } catch (error) {
    return {
      secure: false,
      issues: ['Key manager initialization failed'],
      recommendations: ['Check environment configuration']
    };
  }
};