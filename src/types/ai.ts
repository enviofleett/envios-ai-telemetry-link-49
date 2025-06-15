export type AiProvider = 'openai' | 'google_gemini' | 'anthropic_claude' | 'hugging_face';

export interface AiAssistantSettings {
  id: number;
  provider: AiProvider;
  model: string;
  system_prompt: string | null;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export const AI_PROVIDER_CONFIG: Record<AiProvider, { name: string; secretName: string; docsUrl: string }> = {
  openai: {
    name: 'OpenAI',
    secretName: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  google_gemini: {
    name: 'Google Gemini',
    secretName: 'GEMINI_API_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey'
  },
  anthropic_claude: {
    name: 'Anthropic Claude',
    secretName: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com/settings/keys'
  },
  hugging_face: {
    name: 'Hugging Face',
    secretName: 'HUGGING_FACE_HUB_TOKEN',
    docsUrl: 'https://huggingface.co/settings/tokens'
  }
};

export interface AiProviderThreshold {
  provider: AiProvider;
  daily_limit: number;
  monthly_limit: number;
  updated_at: string;
}
