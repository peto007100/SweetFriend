
import { createClient } from '@supabase/supabase-js';
import { Friend } from '../types';

/**
 * Utilizando import.meta.env para conformidade total com o padrão Vite e requisitos de produção.
 * As variáveis são lidas em tempo de execução e o client é inicializado condicionalmente
 * para evitar erros fatais em ambientes de preview como o AI Studio.
 */
// Fixed: Cast import.meta to any to avoid "Property 'env' does not exist on type 'ImportMeta'"
const env =
  typeof import.meta !== "undefined" &&
  (import.meta as any).env
    ? (import.meta as any).env
    : {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;


const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn("Supabase environment variables are missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Running in preview mode.");
}

// Inicializa o client apenas se as variáveis existirem, evitando o erro "supabaseUrl is required"
const client = isConfigured ? createClient(supabaseUrl as string, supabaseAnonKey as string) : null;

export const supabase = {
  /**
   * Busca todos os amigos da tabela 'Friends' ou 'friends'.
   * Retorna lista vazia se o Supabase não estiver configurado ou falhar, garantindo que o app não quebre.
   */
  async getFriends(): Promise<Friend[]> {
    if (!client) {
      console.warn("Supabase: Client não configurado. O app continuará com dados vazios no preview.");
      return [];
    }

    try {
      // Tenta primeiro a tabela capitalizada 'Friends'
      const { data, error } = await client
        .from('Friends')
        .select('*');

      if (error) {
        // Fixed: Removed error.status check as it doesn't exist on PostgrestError.
        // Relying on Postgres error code '42P01' (Relation does not exist).
        if (error.code === '42P01') {
          const { data: retryData, error: retryError } = await client
            .from('friends')
            .select('*');
          if (retryError) throw retryError;
          return (retryData as Friend[]) || [];
        }
        throw error;
      }

      return (data as Friend[]) || [];
    } catch (error) {
      console.error("Supabase: getFriends error", error);
      return [];
    }
  },

  /**
   * Atualiza os dados de um amigo (Sorteio)
   */
  async updateFriend(id: number, updateData: any): Promise<boolean> {
    if (!client) {
      console.warn("Supabase: Client não configurado. Falha ao salvar resultado do sorteio.");
      return false;
    }

    try {
      // Tenta atualizar na tabela Friends primeiro
      const { error } = await client
        .from('Friends')
        .update(updateData)
        .or(`Id.eq.${id},id.eq.${id}`);

      if (error) {
        // Fallback para tabela em minúsculo
        const { error: retryError } = await client
          .from('friends')
          .update(updateData)
          .or(`Id.eq.${id},id.eq.${id}`);
        
        if (retryError) {
          console.error("Supabase: updateFriend error", retryError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Supabase: updateFriend exception", error);
      return false;
    }
  }
};
