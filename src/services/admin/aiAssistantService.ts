
import { supabase } from '@/integrations/supabase/client';
import type { AiAssistantSettings } from '@/types/ai';

export async function getAiAssistantSettings(): Promise<AiAssistantSettings | null> {
  const { data, error } = await supabase
    .from('ai_assistant_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching AI assistant settings:', error);
    throw error;
  }
  return data as AiAssistantSettings | null;
}

export async function updateAiAssistantSettings(
  settings: Partial<Omit<AiAssistantSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<AiAssistantSettings | null> {
  const { data, error } = await supabase
    .from('ai_assistant_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    console.error('Error updating AI assistant settings:', error);
    throw error;
  }
  return data as AiAssistantSettings | null;
}
