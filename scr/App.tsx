
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabaseService';
import { getAIInsights } from './services/geminiService';
import { Friend, AIInsight } from './types';
import { 
  Sparkles, 
  Lock, 
  Eye, 
  UserCircle,
  Gift,
  CheckCircle2,
  ChevronRight,
  LogOut,
  AlertCircle,
  Loader2,
  PartyPopper
} from 'lucide-react';
import './index.css';

const App: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);
  const [drawnFriend, setDrawnFriend] = useState<Friend | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalização de dados
  const getFId = (f: Friend) => f.Id ?? f.id ?? 0;
  const getFNome = (f: Friend) => f.Nome ?? f.nome ?? '';
  const getFTS = (f: Friend) => f.TemSegredo ?? f.temsegredo ?? f.tem_segredo ?? false;
  const getFSegredo = (f: Friend) => f.Segredo ?? f.segredo ?? '';

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    const data = await supabase.getFriends();
    setFriends(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const loginable = useMemo(() => friends.filter(f => !getFTS(f)), [friends]);

  const handleDraw = () => {
    if (!currentUser) return;
    
    const alreadyDrawnNames = friends
      .filter(f => getFTS(f))
      .map(f => getFSegredo(f));

    const possible = friends.filter(f => {
      const isMe = getFId(f) === getFId(currentUser);
      const isTaken = alreadyDrawnNames.includes(getFNome(f));
      return !isMe && !isTaken;
    });

    if (possible.length === 0) {
      setError("Erro lógico: Não há participantes disponíveis para você.");
      return;
    }

    setDrawnFriend(possible[Math.floor(Math.random() * possible.length)]);
    setError(null);
  };

  const saveResult = async () => {
    if (!currentUser || !drawnFriend) return;
    setSaving(true);
    
    // Tenta salvar usando chaves minúsculas (padrão Postgres)
    const success = await supabase.updateFriend(getFId(currentUser), {
      segredo: getFNome(drawnFriend),
      temsegredo: true
    });

    if (success) {
      setShowSecret(true);
      await loadParticipants();
    } else {
      setError("Erro de banco de dados. Contate o administrador.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-[2rem] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl mb-4">
            <UserCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black">Identifique-se</h2>
          <p className="text-gray-500 text-sm">Seu nome só aparece se você ainda não sorteou.</p>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {loginable.map(f => (
            <button key={getFId(f)} onClick={() => setCurrentUser(f)} className="w-full flex justify-between items-center p-4 bg-gray-800/50 hover:bg-emerald-600 rounded-xl transition-all group">
              <span className="font-bold group-hover:text-white">{getFNome(f)}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ))}
          {loginable.length === 0 && (
            <div className="text-center py-8 text-gray-600 italic">
              <PartyPopper className="mx-auto mb-2 opacity-30" />
              Todos já participaram!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <Gift className="w-8 h-8 text-emerald-500" />
            <h1 className="text-xl font-black uppercase tracking-widest">Amigo Secreto</h1>
          </div>
          <button onClick={() => { setCurrentUser(null); setDrawnFriend(null); setShowSecret(false); }} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
            SAIR <LogOut className="w-4 h-4" />
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-[2.5rem] border border-gray-800 p-8 lg:p-12 shadow-2xl text-center">
          <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-4">Área de Sorteio</p>
          <h2 className="text-3xl font-black mb-8">Olá, {getFNome(currentUser)}!</h2>

          {!drawnFriend ? (
            <button onClick={handleDraw} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
              REALIZAR MEU SORTEIO
            </button>
          ) : (
            <div className="max-w-sm mx-auto">
              <div className={`h-40 border-2 rounded-[2rem] flex flex-col items-center justify-center mb-8 transition-all duration-500 ${showSecret ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-gray-950 border-gray-800'}`}>
                {showSecret ? (
                  <div className="animate-in zoom-in duration-300">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Você tirou:</span>
                    <p className="text-4xl font-black">{getFNome(drawnFriend)}</p>
                  </div>
                ) : (
                  <Lock className="w-12 h-12 text-gray-800" />
                )}
              </div>

              {!showSecret ? (
                <button onClick={saveResult} disabled={saving} className="w-full py-5 bg-white text-gray-950 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" /> : <Eye className="w-5 h-5" />}
                  {saving ? 'SALVANDO...' : 'REVELAR E CONFIRMAR'}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4 text-emerald-400 font-bold bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                  Sorteio Concluído com Sucesso!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
