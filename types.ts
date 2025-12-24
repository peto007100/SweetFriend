
export interface Friend {
  Id: number;
  id?: number; // Alternativa em minúsculo
  Nome: string;
  nome?: string; // Alternativa em minúsculo
  Segredo: string;
  segredo?: string; // Alternativa em minúsculo
  TemSegredo: boolean;
  tem_segredo?: boolean; // Padrão snake_case comum no Postgres
  temsegredo?: boolean;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface AIInsight {
  summary: string;
  funnyFact: string;
  recommendation: string;
}

export interface DrawResult {
  [giverId: number]: number; // Giver ID -> Receiver ID
}
