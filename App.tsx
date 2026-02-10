
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  LogOut, User as UserIcon, Mail, Lock, ArrowRight, UserCheck,
  CalendarDays, Trash2, Star, CheckCircle, Info, Move, MousePointer2,
  ChevronRight, Brain, Lightbulb, ZapOff, Cloud, CloudCheck, CloudOff,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { Priority, Task, Habit, IdentityBoost, PanicSolution, RecurringTask, Frequency, User, BrainCapacity, DopamenuItem } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  TIMER_START: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  TIMER_END: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  XP_GAIN: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
};

const SynapseLogo = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="logo-grad-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" />
    <circle cx="16" cy="16" r="6" stroke="url(#logo-grad-fire)" strokeWidth="2" className="synapse-core" />
    <circle cx="16" cy="16" r="3" fill="url(#logo-grad-fire)" className="synapse-core" />
    <path d="M16 16L26 6" stroke="url(#logo-grad-fire)" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
    <circle cx="26" cy="6" r="2" fill="#ef4444" />
  </svg>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('neuro-session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const isSyncingRef = useRef(false);

  const playAudio = useCallback((soundUrl: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.debug("Audio play blocked"));
  }, [soundEnabled]);

  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'dopamenu'>('execute');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [points, setPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [theme] = useState<'light' | 'dark'>(() => (localStorage.getItem('neuro-theme') as 'light' | 'dark') || 'dark');
  const isDark = theme === 'dark';
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>([]);

  // UI States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [captureEnergy, setCaptureEnergy] = useState<Task['energy']>('Média');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showPlanTutorial, setShowPlanTutorial] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [panicTask, setPanicTask] = useState<Task | null>(null);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [currentArousal, setCurrentArousal] = useState<BrainCapacity>('Neutro');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Inicializa dados do LocalStorage enquanto a nuvem não responde
  useEffect(() => {
    if (!currentUser) return;
    const localData = localStorage.getItem(`data_${currentUser.email}`);
    if (localData) {
      const parsed = JSON.parse(localData);
      setTasks(parsed.tasks || []);
      setRecurringTasks(parsed.recurringTasks || []);
      setHabits(parsed.habits || []);
      setPoints(parsed.points || 0);
      setDopamenuItems(parsed.dopamenuItems || []);
    }
  }, [currentUser]);

  // Sincronização em segundo plano
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') {
      setIsDataLoaded(true);
      return;
    }
    
    const pullFromCloud = async () => {
      setSyncStatus('syncing');
      const cloud = await syncService.pullData(currentUser.email);
      if (cloud) {
        // Merge inteligente ou substituição baseada em timestamp (simplificado: substitui)
        setTasks(cloud.tasks || []);
        setRecurringTasks(cloud.recurringTasks || []);
        setHabits(cloud.habits || []);
        setPoints(cloud.points || 0);
        setDopamenuItems(cloud.dopamenuItems || []);
      }
      setIsDataLoaded(true);
      setSyncStatus('synced');
    };
    pullFromCloud();
  }, [currentUser]);

  // Auto-save e Push para nuvem
  useEffect(() => {
    if (!currentUser || !isDataLoaded) return;
    
    const dataToSave = { tasks, recurringTasks, habits, points, dopamenuItems };
    localStorage.setItem(`data_${currentUser.email}`, JSON.stringify(dataToSave));

    if (currentUser.id === 'guest') return;

    const push = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setSyncStatus('syncing');
      const success = await syncService.pushData(currentUser.email, dataToSave);
      setSyncStatus(success ? 'synced' : 'error');
      isSyncingRef.current = false;
    };

    const t = setTimeout(push, 3000);
    return () => clearTimeout(t);
  }, [tasks, recurringTasks, habits, points, dopamenuItems, currentUser, isDataLoaded]);

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    try {
      const cloudUser = await syncService.findUser(authEmail);
      if (cloudUser && cloudUser.password === authPassword) {
        const u = { id: cloudUser.id, name: cloudUser.name, email: cloudUser.email };
        localStorage.setItem('neuro-session', JSON.stringify(u));
        setCurrentUser(u);
        setIsDataLoaded(false);
      } else {
        alert("Email ou senha incorretos.");
      }
    } catch (err) {
      alert("Problema de conexão com o servidor. Tente novamente em instantes.");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Registro (Offline-First)
  const handleRegister = async () => {
    if (!authName || !authEmail || !authPassword) return alert("Preencha todos os campos.");
    setIsLoadingAuth(true);
    try {
      // Verifica se já existe na nuvem
      const existing = await syncService.findUser(authEmail);
      if (existing) {
        alert("Este e-mail já está em uso.");
        setIsLoadingAuth(false);
        return;
      }

      const newUser = { id: crypto.randomUUID(), name: authName, email: authEmail, password: authPassword };
      
      // Tenta salvar na nuvem
      const savedOnCloud = await syncService.saveUser(newUser);
      
      // Mesmo se falhar na nuvem (erro de servidor), permitimos o acesso e salvamos localmente
      const u = { id: newUser.id, name: newUser.name, email: newUser.email };
      localStorage.setItem('neuro-session', JSON.stringify(u));
      
      // Inicializa dados locais para este novo usuário
      localStorage.setItem(`data_${newUser.email}`, JSON.stringify({
        tasks: [], habits: [], recurringTasks: [], points: 0, dopamenuItems: []
      }));

      setCurrentUser(u);
      setIsDataLoaded(true);

      if (!savedOnCloud) {
        console.warn("A conta foi criada localmente, mas a sincronização com a nuvem falhou. Seus dados serão sincronizados assim que a conexão estabilizar.");
      }
    } catch (e) {
      alert("Erro crítico. Tente usar outro navegador ou limpar o cache.");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    if(confirm("Deseja sair? Seus dados estão salvos localmente e serão sincronizados ao voltar.")) {
      localStorage.removeItem('neuro-session');
      setCurrentUser(null);
      setIsDataLoaded(false);
      setTasks([]);
      setHabits([]);
      setRecurringTasks([]);
    }
  };

  // Timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      playAudio(SOUNDS.TIMER_END);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, playAudio]);

  // Actions
  const addTask = (text: string, p: Priority = Priority.Q2, energy: Task['energy'] = captureEnergy) => {
    if (!text.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      text, priority: p, energy, capacityNeeded: currentArousal,
      completed: false, subtasks: [], date: selectedDate, createdAt: Date.now()
    };
    setTasks(prev => [...prev, t]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          setPoints(p => p + 25);
          playAudio(SOUNDS.TASK_COMPLETE);
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { ...h, streak: h.streak + 1, lastCompleted: today };
      }
      return h;
    }));
  };

  const handleAutoCategorize = async () => {
    if (dayTasks.length === 0) return;
    setIsOptimizing(true);
    try {
      const results = await geminiService.categorizeTasks(dayTasks);
      setTasks(prev => prev.map(t => {
        const suggestion = results.find(r => r.id === t.id);
        if (suggestion) return { ...t, priority: suggestion.priority, energy: suggestion.energy };
        return t;
      }));
    } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
  };

  const handleDecompose = async (task: Task) => {
    setIsDecomposing(true);
    try {
      const steps = await geminiService.decomposeTask(task.text);
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, subtasks: steps } : t));
    } finally { setIsDecomposing(false); }
  };

  const handleTaskDrop = (taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);
  const filteredTasks = useMemo(() => {
    return dayTasks.filter(t => {
      if (currentArousal === 'Exausto') return t.energy === 'Baixa';
      if (currentArousal === 'Hiperfocado') return true;
      return t.energy !== 'Alta';
    });
  }, [dayTasks, currentArousal]);

  const tutorialSteps = [
    { title: "NeuroExecutor", description: "Prótese neural para funções executivas.", icon: <SynapseLogo className="w-16 h-16" />, color: "text-orange-600" },
    { title: "Sincronização Atômica", description: "Seus dados agora são salvos localmente e na nuvem, garantindo persistência eterna.", icon: <CloudCheck size={48} />, color: "text-blue-500" }
  ];

  if (!currentUser) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-10 rounded-[48px] border shadow-2xl ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col items-center mb-10">
          <SynapseLogo className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-black italic tracking-tighter text-orange-600 uppercase">NeuroExecutor</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Prótese para Funções Executivas</p>
        </div>
        <form onSubmit={isRegistering ? (e) => { e.preventDefault(); handleRegister(); } : handleLogin} className="space-y-4">
          {isRegistering && <input required className="w-full py-4 px-6 rounded-2xl border bg-transparent border-slate-800 text-white" placeholder="Seu Nome" value={authName} onChange={e => setAuthName(e.target.value)} />}
          <input required type="email" className="w-full py-4 px-6 rounded-2xl border bg-transparent border-slate-800 text-white" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <input required type="password" className="w-full py-4 px-6 rounded-2xl border bg-transparent border-slate-800 text-white" placeholder="Senha" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          <button type="submit" disabled={isLoadingAuth} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-glow-orange flex items-center justify-center gap-2">
            {isLoadingAuth ? <Loader2 className="animate-spin" /> : (isRegistering ? "Criar Minha Rede" : "Entrar no Fluxo")}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-xs font-bold text-slate-500 uppercase hover:text-orange-500 transition-colors">
          {isRegistering ? "Já sou membro • Entrar" : "Não tenho conta ainda • Registrar"}
        </button>
        <button onClick={() => setCurrentUser({ id: 'guest', name: 'Visitante', email: 'guest@neuro.com' })} className="w-full mt-4 text-[10px] font-bold text-slate-700 uppercase underline opacity-60">Modo Visitante (Sem Nuvem)</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <nav className={`fixed bottom-0 w-full backdrop-blur-xl border-t md:static md:w-72 md:h-screen md:border-r z-50 flex md:flex-col ${isDark ? 'bg-[#0a1128]/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="hidden md:flex flex-col p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600">EXECUTE</h1></div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidade Neural</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentArousal('Exausto')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Exausto' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryLow size={16}/><span className="text-[8px] font-black">EXAUSTO</span>
              </button>
              <button onClick={() => setCurrentArousal('Neutro')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Neutro' ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryMedium size={16}/><span className="text-[8px] font-black">NEUTRO</span>
              </button>
              <button onClick={() => setCurrentArousal('Hiperfocado')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Hiperfocado' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryFull size={16}/><span className="text-[8px] font-black">PICO</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
             <div><p className="text-[10px] font-black text-slate-500">XP</p><p className="text-2xl font-black text-orange-500">{points}</p></div>
             <Trophy className="text-orange-500 opacity-40" />
          </div>
        </div>

        <div className="flex flex-1 justify-around p-2 md:flex-col md:gap-2 md:px-4 md:justify-start">
          <NavButton icon={<Timer />} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton icon={<LayoutGrid />} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<RefreshCw />} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Coffee />} label="Dopamenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
          <NavButton icon={<ListTodo />} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
        </div>

        <div className="hidden md:flex flex-col gap-2 p-4 mt-auto border-t border-slate-800/50">
           <div className="px-4 py-2 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
              {!isDataLoaded ? (
                <span className="flex items-center gap-2 text-blue-500"><Loader2 size={14} className="animate-spin"/> Puxando...</span>
              ) : syncStatus === 'syncing' ? (
                <span className="flex items-center gap-2 text-orange-500"><RefreshCw size={14} className="animate-spin"/> Salvando...</span>
              ) : syncStatus === 'error' ? (
                <span className="flex items-center gap-2 text-red-500"><CloudOff size={14}/> Offline</span>
              ) : (
                <span className="flex items-center gap-2 text-green-500"><CloudCheck size={14}/> Sincronizado</span>
              )}
           </div>
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs text-red-500 hover:bg-red-500/10"> <LogOut size={18}/> Sair </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div className="p-12 text-center border rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-2xl">
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4 block">Fluxo Ultradiano</span>
                  <h2 className="text-[100px] leading-none font-mono font-black tracking-tighter tabular-nums mb-8">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-6">
                    <button onClick={() => { setIsTimerActive(!isTimerActive); if(!isTimerActive) playAudio(SOUNDS.TIMER_START); }} className="w-20 h-20 bg-orange-600 rounded-[32px] text-white shadow-glow-orange flex items-center justify-center hover:bg-orange-500 transition-all">
                      {isTimerActive ? <Pause size={32}/> : <Play size={32} fill="currentColor"/>}
                    </button>
                    <button onClick={() => setTimeLeft(90*60)} className="w-20 h-20 bg-slate-800 rounded-[32px] text-slate-400 flex items-center justify-center"> <RotateCcw size={32}/> </button>
                  </div>
                </div>

                <div className="p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 min-h-[350px] shadow-xl">
                  {selectedTask ? (
                    <div className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h2 className={`text-4xl font-black ${selectedTask.completed ? 'line-through opacity-20' : ''}`}>{selectedTask.text}</h2>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-orange-600/20 text-orange-500 rounded-full text-[8px] font-black uppercase">{selectedTask.priority}</span>
                            <EnergyBadge energy={selectedTask.energy} />
                          </div>
                        </div>
                        <button onClick={() => setPanicTask(selectedTask)} className="p-5 bg-red-600/10 text-red-500 rounded-[28px] hover:bg-red-600 hover:text-white transition-all"> <AlertTriangle size={28}/> </button>
                      </div>
                      <div className="space-y-4">
                        {selectedTask.subtasks.map((s, i) => (
                          <div key={i} className="p-5 bg-slate-800/30 rounded-3xl flex items-center gap-5 border border-slate-700/50 group">
                            <span className="text-[10px] font-black text-orange-500 w-6 h-6 flex items-center justify-center bg-orange-500/10 rounded-full">{i+1}</span>
                            <p className="text-sm font-medium opacity-80">{s}</p>
                          </div>
                        ))}
                        {selectedTask.subtasks.length === 0 && (
                          <button onClick={() => handleDecompose(selectedTask)} className="w-full py-16 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-all">
                            {isDecomposing ? <RefreshCw className="animate-spin text-orange-500" /> : <Sparkles />}
                            <span className="text-[10px] font-black uppercase">Desmembrar com IA (Chunking)</span>
                          </button>
                        )}
                      </div>
                      <button onClick={() => toggleTask(selectedTask.id)} className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${selectedTask.completed ? 'bg-green-600' : 'bg-orange-600'} text-white`}>
                        {selectedTask.completed ? "Reativar" : "Concluir Missão (+25 XP)"}
                      </button>
                    </div>
                  ) : (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-4">
                      <Target size={80}/>
                      <p className="text-xl font-black uppercase">Defina seu alvo</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 border rounded-[40px] bg-slate-900/60 border-slate-800 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Execução Pendente</h3>
                  <div className="space-y-3">
                      {filteredTasks.filter(t => !t.completed).map(t => (
                        <button key={t.id} onClick={() => setSelectedTask(t)} className={`w-full p-5 text-left border rounded-[24px] transition-all group ${selectedTask?.id === t.id ? 'bg-orange-600/10 border-orange-500 ring-1 ring-orange-500' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40'}`}>
                          <p className="text-sm font-bold truncate group-hover:translate-x-1 transition-transform">{t.text}</p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black italic uppercase">Matriz de Eisenhower</h2>
                  <button onClick={() => setShowPlanTutorial(true)} className="p-2 text-slate-600 hover:text-orange-500"><HelpCircle size={20} /></button>
                </div>
                <button onClick={handleAutoCategorize} disabled={isOptimizing} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-black uppercase flex items-center gap-2 shadow-xl disabled:opacity-50">
                  {isOptimizing ? <RefreshCw size={14} className="animate-spin"/> : <Brain size={14}/>} Otimização IA
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-700">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico e Urgente" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Estratégico/Importante" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Delegar/Reduzir" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar Distrações" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <h2 className="text-3xl font-black flex items-center gap-4 italic uppercase text-orange-600"><RefreshCw size={28} /> Hábitos</h2>
                  {habits.map(h => (
                    <div key={h.id} className="p-6 border rounded-[32px] bg-slate-900 border-slate-800 flex justify-between items-center group">
                      <div><p className="font-black text-lg">{h.text}</p><p className="text-[10px] text-slate-500">Âncora: {h.anchor}</p></div>
                      <div className="flex items-center gap-4">
                        <Flame size={20} className={h.streak > 0 ? "text-orange-500" : "text-slate-800"} />
                        <button onClick={() => completeHabit(h.id)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800 text-slate-500 hover:bg-orange-600 hover:text-white transition-all">
                           {h.lastCompleted === new Date().toISOString().split('T')[0] ? <Check size={24} className="text-green-500"/> : <Plus size={24}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-24 space-y-16 text-center animate-in fade-in duration-1000">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase">Captura Atômica</h2>
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[64px] shadow-2xl flex items-center gap-6">
                <input autoFocus className="flex-1 bg-transparent border-none text-3xl font-black outline-none placeholder:text-slate-800" placeholder="O que está na mente?" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }}} />
                <button onClick={() => { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }} className="w-24 h-24 bg-orange-600 rounded-[40px] flex items-center justify-center"><Plus size={48} className="text-white"/></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tutorial Modals */}
      {showTutorial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 text-center space-y-8">
            <div className={`${tutorialSteps[tutorialStep].color} flex justify-center`}>{tutorialSteps[tutorialStep].icon}</div>
            <h2 className="text-3xl font-black uppercase italic">{tutorialSteps[tutorialStep].title}</h2>
            <p className="text-slate-400">{tutorialSteps[tutorialStep].description}</p>
            <button onClick={() => { if(tutorialStep < tutorialSteps.length -1) setTutorialStep(s => s+1); else setShowTutorial(false); }} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase shadow-glow-orange">Próximo</button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all md:flex-row md:justify-start md:gap-5 md:w-full md:px-8 md:py-5 ${active ? 'bg-orange-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800/50'}`}>
    {icon}<span className="text-[10px] mt-2 font-black uppercase md:text-sm md:mt-0 md:tracking-widest">{label}</span>
  </button>
);

const EnergyBadge: React.FC<{ energy: Task['energy'] }> = ({ energy }) => {
  const colors = { 'Baixa': 'bg-green-600/20 text-green-500', 'Média': 'bg-yellow-600/20 text-yellow-500', 'Alta': 'bg-red-600/20 text-red-500' };
  return <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colors[energy]}`}>{energy}</span>;
};

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void }> = ({ priority, title, color, tasks, onSelect, onDrop }) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-orange-500'); };
  const handleDragLeave = (e: React.DragEvent) => e.currentTarget.classList.remove('ring-2', 'ring-orange-500');
  const handleOnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-orange-500');
    const taskId = e.dataTransfer.getData("taskId");
    if(taskId) onDrop(taskId, priority);
  };

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleOnDrop} className={`p-10 border rounded-[48px] ${color} min-h-[420px] shadow-sm relative`}>
      <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-8">{title}</h3>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {tasks.map(t => (
          <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", t.id)} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center group cursor-grab">
            <span onClick={() => onSelect(t)} className="text-sm font-black truncate">{t.text}</span>
            <button onClick={() => onSelect(t)} className="opacity-0 group-hover:opacity-100 p-2 bg-orange-600 rounded-xl transition-all"><Target size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
