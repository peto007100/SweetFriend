
import { Friend, Task } from '../types';

/**
 * Replicating the SupabaseService logic from C# to JS/TS.
 */
export class SupabaseService {
  private readonly url = "https://hbnazrzohiatgzyfzofm.supabase.co";
  private readonly key = "sb_publishable_CWnV65E5zOAVxXYanQFI_Q_-1gbTGbt";

  private get headers() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  /**
   * Busca todos os amigos da tabela 'friends'
   */
  public async getFriends(): Promise<Friend[]> {
    try {
      const response = await fetch(`${this.url}/rest/v1/friends?select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.statusText}`);
      }

      const data: Friend[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error in getFriends:", error);
      return [];
    }
  }

  /**
   * Atualiza os dados de um amigo (Persistência do Sorteio)
   */
  public async updateFriend(id: number, data: any): Promise<boolean> {
    try {
      // Tentamos filtrar tanto por 'Id' quanto por 'id' caso um falhe
      const response = await fetch(`${this.url}/rest/v1/friends?Id=eq.${id}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Supabase Update Error Details:", {
          status: response.status,
          statusText: response.statusText,
          details: errorData
        });
        
        // Se falhou por causa do nome da coluna 'Id', tentamos 'id' (minúsculo)
        if (response.status === 400 || response.status === 404) {
             const retryResponse = await fetch(`${this.url}/rest/v1/friends?id=eq.${id}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(data),
              });
             return retryResponse.ok;
        }
      }

      return response.ok;
    } catch (error) {
      console.error("Network or parsing error in updateFriend:", error);
      return false;
    }
  }

  public async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.url}/rest/v1/tarefas?select=*`, {
        method: 'GET',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch tasks`);
      return await response.json();
    } catch (error) {
      console.error("Error in getTasks:", error);
      return [];
    }
  }
}

export const supabase = new SupabaseService();
