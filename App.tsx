
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabaseService';
import { getAIInsights } from './services/geminiService';
import { Friend, AIInsight } from './types';
import { 
  Users, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Eye, 
  EyeOff,
  UserCircle,
  Gift,
  CheckCircle2,
  ChevronRight,
  LogOut,
  AlertCircle,
  Loader2,
  PartyPopper
} from 'lucide-react';

const App: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);
  const [drawnFriend, setDrawnFriend] = useState<Friend | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalização para leitura (independente de case)
  const getFId = (f: Friend) => f.Id ?? f.id ?? 0;
  const getFNome = (f: Friend) => f.Nome ?? f.nome ?? '';
  const getFTS = (f: Friend) => f.TemSegredo ?? f.temsegredo ?? f.tem_segredo ?? false;
  const getFSegredo = (f: Friend) => f.Segredo ?? f.segredo ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabase.getFriends();
      setFriends(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Erro ao carregar participantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Login: Somente quem ainda não sorteou (TemSegredo false)
  const loginableFriends = useMemo(() => {
    return friends.filter(f => !getFTS(f));
  }, [friends]);

  const performDraw = async () => {
    if (!currentUser) return;

    // 1. Quem já foi sorteado (está na coluna Segredo de alguém)
    const takenNames = friends
      .filter(f => getFTS(f))
      .map(f => getFSegredo(f));

    // 2. Alvos válidos: Não sou eu E ninguém tirou ainda
    const availableTargets = friends.filter(f => {
      const name = getFNome(f);
      const isMe = getFId(f) === getFId(currentUser);
      const isTaken = takenNames.includes(name);
      return !isMe && !isTaken;
    });

    if (availableTargets.length === 0) {
      setError("Não há amigos disponíveis (todos já foram sorteados ou sobrou apenas você).");
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableTargets.length);
    setDrawnFriend(availableTargets[randomIndex]);
    setError(null);
  };

  const handleRevealAndSave = async () => {
    if (!currentUser || !drawnFriend) return;
    
    setSaving(true);
    setError(null);

    // No Postgres do Supabase, colunas criadas sem aspas ficam minúsculas.
    // Enviamos o payload com nomes em minúsculo para garantir compatibilidade.
    const updatePayload = {
      segredo: getFNome(drawnFriend),
      temsegredo: true
    };

    const success = await supabase.updateFriend(getFId(currentUser), updatePayload);

    if (success) {
      setShowSecret(true);
      await fetchData(); // Recarrega lista
    } else {
      setError("Falha ao salvar no banco. Verifique o console para detalhes técnicos.");
    }
    setSaving(false);
  };

  const generateAIInsights = async () => {
    if (friends.length === 0) return;
    setAiLoading(true);
    const result = await getAIInsights(friends);
    setInsights(result);
    setAiLoading(false);
  };

  if (!currentUser && !loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 p-6">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full"></div>
        <div className="max-w-md w-full relative">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="mb-6 inline-block p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl">
              <UserCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Quem é você?</h2>
            <p className="text-gray-400 mb-8 text-sm">Selecione seu nome para realizar seu sorteio.</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {loginableFriends.length > 0 ? loginableFriends.map(friend => (
                <button
                  key={getFId(friend)}
                  onClick={() => setCurrentUser(friend)}
                  className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gray-800/50 hover:bg-emerald-600 border border-gray-700 hover:border-emerald-400 transition-all group"
                >
                  <span className="text-gray-200 group-hover:text-white font-bold">{getFNome(friend)}</span>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-all" />
                </button>
              )) : (
                <div className="py-10 text-gray-500 flex flex-col items-center gap-4">
                  <PartyPopper className="w-12 h-12 text-emerald-500 opacity-50" />
                  <p className="text-lg font-bold">Tudo pronto! Todos já sortearam.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto py-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Amigo Secreto</h1>
              <p className="text-[10px] text-emerald-400 font-black tracking-[0.2em] uppercase">
                Usuário: {currentUser ? getFNome(currentUser) : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setCurrentUser(null); setDrawnFriend(null); setShowSecret(false); }}
            className="p-3 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              {!drawnFriend ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-emerald-500 mx-auto mb-6 opacity-50" />
                  <h2 className="text-3xl font-black mb-4">Seu Sorteio</h2>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    Você não poderá trocar depois. O sistema garantirá que você não tire a si mesmo e nem alguém que já foi escolhido.
                  </p>
                  <button 
                    onClick={performDraw}
                    className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-xl hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-emerald-500/20"
                  >
                    Realizar Sorteio
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-sm font-black text-gray-500 mb-8 uppercase tracking-[0.3em]">Destinatário Encontrado</h3>
                  
                  <div className={`relative mx-auto w-full max-w-sm h-48 rounded-[2.5rem] border-2 flex items-center justify-center transition-all duration-700 mb-10
                    ${showSecret ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-gray-950 border-gray-700 shadow-inner'}`}>
                    {showSecret ? (
                      <div className="animate-in zoom-in duration-500">
                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-2 block">Você tirou:</span>
                        <h4 className="text-5xl font-black text-white">{getFNome(drawnFriend)}</h4>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Lock className="w-12 h-12" />
                        <span className="text-xs font-bold uppercase tracking-widest">Confirme para ver</span>
                      </div>
                    )}
                  </div>

                  {!showSecret ? (
                    <button 
                      onClick={handleRevealAndSave}
                      disabled={saving}
                      className="w-full max-w-sm py-5 bg-white text-gray-950 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                      {saving ? 'Gravando...' : 'Revelar e Salvar'}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 px-8 py-3 rounded-full border border-emerald-400/20">
                        <CheckCircle2 className="w-5 h-5" />
                        Sorteio Confirmado!
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Saia da sua conta agora para que o próximo possa sortear.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Status do Grupo ({friends.length})</h3>
              <div className="space-y-4">
                {friends.map(f => (
                  <div key={getFId(f)} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]
                        ${getFTS(f) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-800 text-gray-600'}`}>
                        {getFNome(f).charAt(0)}
                      </div>
                      <span className={`text-xs font-bold ${getFId(f) === getFId(currentUser!) ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {getFNome(f)}
                      </span>
                    </div>
                    {getFTS(f) ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500/60 uppercase">
                        OK
                      </div>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-gray-800"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
