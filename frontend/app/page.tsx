"use client";
import { useEffect, useState } from 'react';
import { fetchTodayQuestion, submitAnswer, getNextReset } from '../lib/api';
import { getStreakData, updateStreak, getSessionHash, StreakData } from '../lib/streak';
import { Flame, Info, Send, CheckCircle2, XCircle, Clock, ChevronRight, Share2, HelpCircle, AlertCircle, BarChart2 } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<'IDLE'|'EVALUATING'|'DONE'|'ALREADY_ANSWERED'>('IDLE');
  const [feedback, setFeedback] = useState<any>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [resetTime, setResetTime] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState('');
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showTermoModal, setShowTermoModal] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('__ihi_saw_modal_v2');
    if (!hasSeenModal) {
      setShowIntroModal(true);
    }
  }, []);
 
  const closeIntroModal = () => {
    localStorage.setItem('__ihi_saw_modal_v2', 'true');
    setShowIntroModal(false);
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTodayQuestion();
        setQuestion(data);

        const sData = getStreakData();
        setStreakData(sData);

        const today = new Date().toISOString().split('T')[0];
        if (sData.lastAnsweredDate === today && sData.history.length > 0 && sData.history[0].questionId === data.id) {
          setState('ALREADY_ANSWERED');
          setFeedback({
            status: sData.lastResult,
            feedback: "Você já realizou o desafio técnico de hoje! Volte amanhã para manter seu Streak crescendo.",
            referenceAnswer: "" 
          });
          // Não abre mais o modal termo automaticamente
        }
        
        const resetInfo = await getNextReset();
        setResetTime(resetInfo.resetAt);
        setLoading(false);
      } catch (e) {
        console.error("Nenhuma pergunta encontrada no banco de dados.");
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!resetTime) return;
    const interval = setInterval(() => {
      const diff = new Date(resetTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        window.location.reload();
        return;
      }
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [resetTime]);

  const handleSubmit = async () => {
    if (!answer.trim() || state === 'EVALUATING') return;
    setState('EVALUATING');
    const hash = getSessionHash();
    
    try {
      const res = await submitAnswer(hash, answer);
      // res returns { status: 'CORRECT'|'PARTIAL'|'WRONG', feedback, referenceAnswer }
      const newStreak = updateStreak(res.status, question.id);
      if (newStreak) setStreakData(newStreak);
      
      setFeedback(res);
      setState('DONE');
      // Permanece na tela principal, o modal só é acessado via botão Stats
    } catch (err: any) {
      if (err.message === 'JÁ_RESPONDIDO') {
        setState('ALREADY_ANSWERED');
        setFeedback({ status: 'CORRECT', feedback: 'Sua resposta já foi salva com sucesso hoje! Volte amanhã.' });
        // Não abre modal auto
      } else {
        alert("Falha ao comunicar com os servidoreis centrais.");
        setState('IDLE');
      }
    }
  };

  const handleShare = () => {
    if (!streakData) return;
    const text = `🧠 I Have IdeA\n🔥 ${streakData.streak} Dias\nStatus Hoje: ${feedback?.status === 'CORRECT' ? '✅' : feedback?.status === 'PARTIAL' ? '⚠️' : '❌'}\nMinha melhor sequência: ${streakData.longestStreak}\nJogue em: meu-dominio.com`;
    navigator.clipboard.writeText(text);
    alert('Progresso copiado para a área de transferência!');
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#020804]">
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary-green)', borderTopColor: 'transparent' }}></div>
    </div>
  );

  const winPercentage = streakData && streakData.totalGames > 0 
    ? Math.round(((streakData.correctCount + streakData.partialCount) / streakData.totalGames) * 100) 
    : 0;

  return (
    <div className="flex flex-col min-h-screen px-6 py-6 font-sans mx-auto max-w-4xl relative">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-white">I have</span>
          <span className="text-white">
            <span style={{ color: 'var(--color-primary-green)' }}>I</span>
            de
            <span style={{ color: 'var(--color-primary-green)' }}>A</span>
          </span>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
           <span onClick={() => setShowTermoModal(true)} className="hover:text-white cursor-pointer transition-colors flex items-center gap-1">
            <BarChart2 size={16} /> Status
          </span>
          <span onClick={() => setShowIntroModal(true)} className="hover:text-white cursor-pointer transition-colors flex items-center gap-1">
            <Info size={16} /> Instruções
          </span>
        </nav>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center mb-24">
        <div className="w-full shadow-2xl rounded-xl border flex flex-col" 
             style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          
          <div className="h-10 border-b flex items-center px-4 justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            <div className="font-mono text-xs opacity-50">dev-session.sh</div>
          </div>

          <div className="p-6 md:p-10 flex flex-col gap-6">
            {question ? (
              <>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary-green)' }}>
                    #TASK-{question.id.substring(0, 4)}
                  </span>
                  <span className="text-xs uppercase px-3 py-1 rounded border opacity-70 font-mono tracking-widest" style={{ borderColor: 'var(--color-border)' }}>
                    {question.category} • {question.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">{question.question}</h2>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                 <Clock size={40} className="mb-4 opacity-50" />
                 <h2 className="text-xl font-bold text-white mb-2">Nenhum desafio ativo na base</h2>
                 <p className="text-sm max-w-sm">Aguardando novo deploy no banco de dados.</p>
              </div>
            )}

            {question && state === 'IDLE' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-500 mt-6">
                <div className="relative border rounded p-1 transition-colors" 
                     style={{ borderColor: answer.length > 0 ? 'var(--color-primary-green)' : 'var(--color-border)' }}>
                  <textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value.substring(0, 2000))}
                    placeholder="// Implemente sua perspectiva analítica aqui. Avaliamos a estrutura da lógica e não decorebas."
                    className="w-full h-56 p-4 resize-none focus:outline-none text-sm md:text-base leading-relaxed bg-transparent text-white"
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-mono opacity-50">{answer.length}/2000 chars</span>
                  <button 
                    disabled={answer.length < 10}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 rounded font-bold transition-all disabled:opacity-50 text-black hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary-green)' }}
                  >
                    <Send size={18} /> Submeter Arquitetura
                  </button>
                </div>
              </div>
            )}

            {state === 'EVALUATING' && (
              <div className="flex flex-col items-center justify-center p-16 gap-6 border border-dashed rounded-lg mt-6" style={{ borderColor: 'var(--color-border)' }}>
                 <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary-green)', borderTopColor: 'transparent' }}></div>
                 <span className="font-mono text-sm animate-pulse text-[#34d399]">Avaliando integridade lógica...</span>
              </div>
            )}

            {(state === 'DONE' || state === 'ALREADY_ANSWERED') && feedback && (
               <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 fade-in mt-6">
                 {/* Feedback Rápido na tela de trás */}
                 <div className="p-6 rounded-lg text-left border" style={{ 
                    backgroundColor: feedback.status === 'CORRECT' ? 'rgba(52, 211, 153, 0.05)' : feedback.status === 'PARTIAL' ? 'rgba(250, 204, 21, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    borderColor: feedback.status === 'CORRECT' ? '#34d399' : feedback.status === 'PARTIAL' ? '#facc15' : '#ef4444'
                  }}>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: feedback.status === 'CORRECT' ? '#34d399' : feedback.status === 'PARTIAL' ? '#facc15' : '#ef4444' }}>
                      {feedback.status === 'CORRECT' ? <><CheckCircle2 size={24} /> Validação Perfeita</> : feedback.status === 'PARTIAL' ? <><AlertCircle size={24} /> Abordagem Parcial</> : <><XCircle size={24} /> Ponto Crítico Perdido</>}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-300">{feedback.feedback}</p>
                 </div>

                 {/* Countdown na tela final */}
                 <div className="flex bg-[#020804] p-8 rounded-lg border flex-col items-center mt-2 gap-3" style={{ borderColor: 'var(--color-border)' }}>
                   <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Próximo desafio indexado em</span>
                   <span className="text-5xl font-mono tracking-wider" style={{ color: 'var(--color-primary-green)' }}>{timeLeft || '--:--:--'}</span>
                 </div>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL TERMO-LIKE DE ESTATÍSTICAS */}
      {showTermoModal && streakData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020804]/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-md bg-[#161a1d] shadow-2xl rounded border border-[#2b2f33] flex flex-col p-8 relative">
              <button onClick={() => setShowTermoModal(false)} className="absolute top-4 right-5 text-[#888] hover:text-white font-bold text-xl">
                ✕
              </button>
              
              <h2 className="text-center font-bold tracking-widest text-lg uppercase text-white mb-6">Progresso</h2>

              {/* Estatísticas Top */}
              <div className="flex justify-between items-start text-center mb-10 w-full px-2">
                 <div className="flex flex-col w-1/4">
                    <span className="text-4xl font-bold text-white">{streakData.totalGames}</span>
                    <span className="text-[10px] text-[#888] mt-1 leading-tight tracking-wide">Jogos</span>
                 </div>
                 <div className="flex flex-col w-1/4">
                    <span className="text-4xl font-bold text-white">{winPercentage}%</span>
                    <span className="text-[10px] text-[#888] mt-1 leading-tight tracking-wide">De Aproveitamento</span>
                 </div>
                 <div className="flex flex-col w-1/4">
                    <span className="text-4xl font-bold text-white">{streakData.streak}</span>
                    <span className="text-[10px] text-[#888] mt-1 leading-tight tracking-wide">Sequência atual</span>
                 </div>
                 <div className="flex flex-col w-1/4">
                    <span className="text-4xl font-bold text-white">{streakData.longestStreak}</span>
                    <span className="text-[10px] text-[#888] mt-1 leading-tight tracking-wide">Melhor sequência</span>
                 </div>
              </div>

              <h2 className="text-center font-bold tracking-widest text-sm uppercase text-white mb-4">Eficiência de Respostas</h2>
              
              {/* Barras de Distribuição */}
              <div className="flex flex-col gap-2 mb-10 w-full pl-2 pr-6">
                
                <div className="flex items-center w-full">
                   <div className="w-8 flex justify-center text-[#888]"><CheckCircle2 size={16} color="#34d399" /></div>
                   <div className="flex-1 bg-[#333] h-6 relative ml-2 flex rounded overflow-hidden">
                     <div className="h-full bg-[#34d399] flex items-center justify-end px-2" style={{ width: streakData.correctCount === 0 ? 'auto' : `${(streakData.correctCount/streakData.totalGames)*100}%`, minWidth: '8%' }}>
                       <span className="text-black text-xs font-bold">{streakData.correctCount}</span>
                     </div>
                   </div>
                </div>

                <div className="flex items-center w-full">
                   <div className="w-8 flex justify-center text-[#888]"><AlertCircle size={16} color="#facc15" /></div>
                   <div className="flex-1 bg-[#333] h-6 relative ml-2 flex rounded overflow-hidden">
                     <div className="h-full bg-[#facc15] flex items-center justify-end px-2" style={{ width: streakData.partialCount === 0 ? 'auto' : `${(streakData.partialCount/streakData.totalGames)*100}%`, minWidth: '8%' }}>
                       <span className="text-black text-xs font-bold">{streakData.partialCount}</span>
                     </div>
                   </div>
                </div>

                <div className="flex items-center w-full">
                   <div className="w-8 flex justify-center text-[#888]"><XCircle size={16} color="#ef4444" /></div>
                   <div className="flex-1 bg-[#333] h-6 relative ml-2 flex rounded overflow-hidden">
                     <div className="h-full bg-[#ef4444] flex items-center justify-end px-2" style={{ width: streakData.wrongCount === 0 ? 'auto' : `${(streakData.wrongCount/streakData.totalGames)*100}%`, minWidth: '8%' }}>
                       <span className="text-white text-xs font-bold">{streakData.wrongCount}</span>
                     </div>
                   </div>
                </div>

              </div>

              {/* Countdown e Compartilhamento */}
              <div className="flex w-full mt-2 pt-6 border-t border-[#333] justify-between items-center gap-6">
                 <div className="flex flex-col items-center flex-1">
                   <span className="text-xs uppercase text-[#888] tracking-widest mb-1">Próximo Desafio</span>
                   <span className="text-3xl font-bold font-mono tracking-wide text-white">{timeLeft || '--:--:--'}</span>
                 </div>
                 
                 <div className="flex-1">
                   <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 py-3 bg-[#1ca45c] text-white uppercase tracking-widest font-bold text-sm rounded transition hover:bg-[#1fa15c]">
                     Compartilhar <Share2 size={16} />
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Intro Modal Overlay */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in fade-in">
           <div className="max-w-lg w-full p-8 border rounded-xl relative shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-primary-green)' }}>
              <HelpCircle size={24} /> Protocolo de Avaliação
            </h2>
            <ul className="space-y-6 text-sm text-gray-300 leading-relaxed font-sans mb-8">
              <li className="flex gap-4 items-start">
                <ChevronRight size={20} className="shrink-0 mt-0.5 text-[#34d399]" />
                <span><strong>Pense antes de promptar.</strong> Adoramos Inteligência Artificial (tanto que "I have <strong className="text-[#34d399]">IA</strong>"), mas nosso intuito é fazer você tirar um momento do seu dia para exercitar a mente e raciocinar sobre as fundações do software.</span>
              </li>
              <li className="flex gap-4 items-start">
                <ChevronRight size={20} className="shrink-0 mt-0.5 text-[#34d399]" />
                <span>Você não vai compilar código, mas deve defender um argumento técnico diariamente, que será avaliado por nossa rede neural.</span>
              </li>
              <li className="flex gap-4 items-start">
                <ChevronRight size={20} className="shrink-0 mt-0.5 text-[#34d399]" />
                <span>Exatidão total pontua com <CheckCircle2 size={16} className="inline text-[#34d399] -mt-1"/> <strong>Verdadeiro</strong>. Respostas certas mas rasas geram <AlertCircle size={16} className="inline text-[#facc15] -mt-1"/> <strong>Parcial</strong> (Mantém seu Streak ativo).</span>
              </li>
              <li className="flex gap-4 items-start">
                <ChevronRight size={20} className="shrink-0 mt-0.5 text-[#34d399]" />
                <span>Respostas vazias, cômicas ou fora do escopo recebem <XCircle size={16} className="inline text-[#ef4444] -mt-1"/> <strong>Erro</strong> absoluto e rompem a sua sequência.</span>
              </li>
            </ul>
            <button 
              onClick={closeIntroModal}
              className="w-full py-4 font-bold text-black rounded flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary-green)' }}>
              Entendi <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
