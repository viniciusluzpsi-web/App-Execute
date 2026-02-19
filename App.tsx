
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  Trash2, Star, CheckCircle, Info, Move,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope,
  Cloud, CloudOff, CloudSync, Mail, Rocket, BrainCog, StickyNote, ListChecks, Music, Activity, Star as StarIcon, Cpu,
  ChefHat, IceCream, Pizza, Cookie, ShieldAlert, ZapOff as ZapIcon, FastForward, Filter, Settings, Fingerprint,
  Sunrise, Sunset, MoonStar, Briefcase, Heart, Edit3, Sparkle, Swords, Gem, Lock, Unlock, Zap as ZapBolt,
  Zap as SparkleIcon, History, Fingerprint as IdentityIcon, Send, Brain as BrainIcon, LifeBuoy, FileText, Layers,
  Loader, RefreshCcw, Info as InfoIcon, ArrowUpRight, BookOpenCheck, Menu, User, LogOut, MoreHorizontal, CheckSquare
} from 'lucide-react';
import { Priority, Task, Habit, RecurringTask, Frequency, BrainCapacity, DopamenuItem, DayPeriod, Upgrade, Achievement, TimeboxEntry } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  UPGRADE: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CAPTURE: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

const PERIOD_LABELS: Record<DayPeriod, string> = {
  Morning: 'Manhã',
  Day: 'Tarde',
  Evening: 'Noite',
  Night: 'Madrugada'
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'none'>('none');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neuro-dark-mode') !== 'false');
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem('neuro-sound-enabled') !== 'false');
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dopamenu' | 'dashboard'>('capture');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  
  const [userEnergy, setUserEnergy] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [newTaskText, setNewTaskText] = useState("");
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const editingTask = useMemo(() => tasks.find(t => t.id === editingTaskId) || null, [tasks, editingTaskId]);
  const timerRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const lastCloudDataRef = useRef<string>("");

  const playAudio = useCallback((url: string) => {
    if (!isSoundEnabled) return;
    new Audio(url).play().catch(() => {});
  }, [isSoundEnabled]);

  // Monitora Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setPoints(0); setTasks([]); setHabits([]); setRecurringTasks([]);
        setSyncStatus('none');
        setIsDataLoaded(false);
        lastCloudDataRef.current = "";
      }
    });
    return () => unsubscribe();
  }, []);

  // Pull Data (Realtime)
  useEffect(() => {
    if (!user) return;
    setSyncStatus('syncing');
    const unsubscribe = syncService.subscribeToUserData(user.uid, (data) => {
      if (data) {
        const dataStr = JSON.stringify(data);
        if (dataStr === lastCloudDataRef.current) {
          setSyncStatus('synced');
          return;
        }
        
        lastCloudDataRef.current = dataStr;
        if (data.points !== undefined) setPoints(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.recurringTasks) setRecurringTasks(data.recurringTasks);
        if (data.habits) setHabits(data.habits);
        if (data.upgrades) setUpgrades(data.upgrades);
        if (data.achievements) setAchievements(data.achievements);
      }
      setSyncStatus('synced');
      setIsDataLoaded(true);
    });
    return () => unsubscribe();
  }, [user]);

  // Push Data (Debounced)
  useEffect(() => {
    if (!isDataLoaded || !user) return;
    
    const currentState = { tasks, recurringTasks, habits, points, upgrades, achievements };
    const currentStateStr = JSON.stringify(currentState);
    
    // Evita loop infinito se os dados locais forem iguais aos que acabamos de puxar da nuvem
    if (currentStateStr === lastCloudDataRef.current) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const success = await syncService.pushData(user.uid, currentState);
      if (success) {
        lastCloudDataRef.current = currentStateStr;
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    }, 2000);
  }, [tasks, recurringTasks, habits, points, upgrades, achievements, user, isDataLoaded]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    try { 
      await signInWithPopup(auth, googleProvider); 
    } catch (e: any) { 
      setAuthErrorCode(e.code);
      if (e.code === 'auth/configuration-not-found' || e.code === 'auth/operation-not-allowed') {
        setAuthError("O login do Google não está ativado no Firebase. Vá em Authentication → Sign-in method e ative o 'Google'.");
      } else if (e.code === 'auth/unauthorized-domain') {
        setAuthError(`Domínio "${window.location.hostname}" não autorizado. Adicione-o em Authentication → Settings → Authorized domains.`);
      } else {
        setAuthError(`Erro Neural: ${e.message}`);
      }
    }
  };

  const handleLogout = async () => { await signOut(auth); setShowMobileDrawer(false); };

  useEffect(() => {
    if (!isDarkMode) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
  }, [isDarkMode]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0 && isTimerActive) {
         setPoints(p => p + 500);
         playAudio(SOUNDS.UPGRADE);
         setIsTimerActive(false);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft]);

  const handleSmartCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskInput = newTaskText.trim();
    if (!taskInput || !user) return;
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      id: tempId, text: taskInput, priority: Priority.Q2, energy: 'Média', capacityNeeded: 'Neutro', completed: false, subtasks: [], date: new Date().toISOString().split('T')[0], createdAt: Date.now(), isRefining: true
    };
    setTasks(prev => [tempTask, ...prev]);
    setNewTaskText("");
    setPoints(p => p + 15);
    playAudio(SOUNDS.CAPTURE);
    try {
      const parsed = await geminiService.parseNaturalTask(taskInput);
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, priority: (parsed.priority as Priority) || t.priority, energy: (parsed.energy as any) || t.energy, subtasks: parsed.subtasks || [], isRefining: false } : t));
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, isRefining: false } : t));
    }
  };

  const decomposeTaskAI = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    updateTaskDetails(id, { isRefining: true });
    try {
      const steps = await geminiService.decomposeTask(task.text);
      updateTaskDetails(id, { subtasks: steps, isRefining: false });
      setPoints(p => p + 50);
      playAudio(SOUNDS.UPGRADE);
    } catch {
      updateTaskDetails(id, { isRefining: false });
    }
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    setPoints(p => p + 100);
    playAudio(SOUNDS.TASK_COMPLETE);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskDetails = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { ...h, lastCompleted: today, streak: h.streak + 1, completedDates: [...h.completedDates, today] };
      }
      return h;
    }));
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-2xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
      
      <div className="p-5 theme-bg-input border rounded-3xl space-y-4">
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Neural ID</p>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500">{isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
              <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500">{isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
            </div>
         </div>
         {user && (
           <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-orange-500/20" alt="User" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black truncate theme-text-main uppercase">{user.displayName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">XP: {points}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 text-red-500"><LogOut size={12}/> Logout</button>
           </div>
         )}
      </div>

      <div className="p-4 theme-bg-input border rounded-3xl space-y-3">
        <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest text-center">Bateria Biológica</p>
        <div className="flex justify-between items-center gap-2">
          {['Baixa', 'Média', 'Alta'].map(ev => (
            <button key={ev} onClick={() => setUserEnergy(ev as any)} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${userEnergy === ev ? 'bg-orange-600/10 border-orange-500/30 shadow-glow-orange scale-105' : 'opacity-40 hover:opacity-100'}`}>
              <div className={ev === 'Baixa' ? 'text-red-500' : ev === 'Média' ? 'text-yellow-500' : 'text-green-500'}>
                {ev === 'Baixa' ? <BatteryLow size={18}/> : ev === 'Média' ? <BatteryMedium size={18}/> : <BatteryFull size={18}/>}
              </div>
              <span className="text-[8px] font-black uppercase mt-1">{ev}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen theme-bg-body flex items-center justify-center p-6">
        <div className="max-w-md w-full theme-bg-card border-2 theme-border p-10 rounded-[48px] shadow-2xl flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95">
           <div className="w-24 h-24 bg-orange-600/10 rounded-full flex items-center justify-center border border-orange-600/20 shadow-glow-orange synapse-core"><Brain size={48} className="text-orange-500"/></div>
           <div className="space-y-2">
             <h1 className="text-4xl font-black italic uppercase text-orange-600 tracking-tighter">NeuroExecutor</h1>
             <p className="text-xs font-bold theme-text-muted uppercase tracking-widest leading-relaxed">Alta Performance Assistida por IA.</p>
           </div>

           {authError && (
             <div className="p-5 bg-red-600/10 border border-red-500/20 rounded-3xl text-[10px] text-red-500 font-bold uppercase space-y-3">
                <div className="flex items-center justify-center gap-2"><ShieldAlert size={18}/> <span>Erro Crítico</span></div>
                <p className="theme-text-main opacity-90">{authError}</p>
                <div className="p-3 bg-black/20 rounded-xl text-[8px] font-mono text-left">
                  {authErrorCode === 'auth/operation-not-allowed' ? "Ação: Ative o 'Google' em Firebase Console → Authentication." : "Ação: Autorize o domínio na Vercel no Firebase Console."}
                </div>
             </div>
           )}

           <button onClick={handleGoogleLogin} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase shadow-glow-orange hover:scale-105 transition-all flex items-center justify-center gap-3">
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-6 h-6 bg-white p-1 rounded-full" alt="G" />
             Ativar Córtex
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300`}>
      <header className="md:hidden sticky top-0 left-0 w-full theme-bg-sidebar backdrop-blur-xl border-b z-[60] flex items-center justify-between px-6 py-4">
         <div className="flex items-center gap-2"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
         <button onClick={() => setShowMobileDrawer(true)} className="p-2.5 theme-bg-input border rounded-xl theme-text-main relative">
            <User size={20}/>
            {syncStatus === 'syncing' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>}
         </button>
      </header>

      {showMobileDrawer && (
        <div className="fixed inset-0 z-[100] md:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileDrawer(false)}></div>
           <div className="absolute right-0 top-0 h-full w-[85%] theme-bg-sidebar border-l theme-border p-8 flex flex-col animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-black uppercase italic theme-text-main">Neural Status</h2>
                 <button onClick={() => setShowMobileDrawer(false)} className="p-2 theme-text-muted"><X size={24}/></button>
              </div>
              <SidebarContent />
           </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 h-screen theme-bg-sidebar border-r p-8 space-y-6 z-50 overflow-y-auto no-scrollbar">
        <SidebarContent />
        <nav className="flex-1 space-y-1">
          <NavBtn icon={<ListTodo/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
          <NavBtn icon={<Timer/>} label="Fluxo" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
          <NavBtn icon={<LayoutGrid/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
          <NavBtn icon={<RefreshCw/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
          <NavBtn icon={<Coffee/>} label="DopaMenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')}/>
          <NavBtn icon={<TrendingUp/>} label="Stats" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
          <NavBtn icon={<Binary/>} label="Mods" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {activeTab === 'capture' && (
            <div className="min-h-[70vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange"><BrainIcon className="text-orange-500" size={32}/></div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Captura Neural</h2>
                <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.3em]">Externalize o ruído cerebral agora.</p>
              </div>
              <form onSubmit={handleSmartCapture} className="relative max-w-2xl mx-auto w-full">
                <div className="p-5 md:p-8 rounded-[40px] border-2 transition-all duration-500 theme-bg-card theme-border focus-within:border-orange-600 shadow-glow-orange/10">
                  <div className="flex items-center gap-4">
                    <input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-xl md:text-2xl font-black theme-text-main" placeholder="Iniciando nova sinapse..." />
                    <button type="submit" className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-glow-orange text-white"><Plus size={24}/></button>
                  </div>
                </div>
              </form>
              <div className="max-w-xl mx-auto w-full mt-10 space-y-3">
                {tasks.filter(t => !t.completed).slice(0, 5).map(t => (
                  <TaskCard key={t.id} task={t} onComplete={completeTask} onEdit={() => setEditingTaskId(t.id)} onDecompose={() => decomposeTaskAI(t.id)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-in fade-in space-y-12 py-10">
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Fluxo Ultradiano</h2>
                  <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Atenção Profunda por 90 Minutos.</p>
               </div>
               <div className="p-10 md:p-20 theme-bg-card rounded-[64px] border theme-border flex flex-col items-center justify-center space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <div className="text-8xl md:text-[10rem] font-black italic tracking-tighter tabular-nums theme-text-main drop-shadow-2xl">{formatTime(timeLeft)}</div>
                  <div className="flex gap-6 z-10">
                    <button onClick={() => setIsTimerActive(!isTimerActive)} className="px-12 py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase flex items-center gap-4 shadow-glow-orange text-xl hover:scale-105 transition-all">
                      {isTimerActive ? <><Pause size={28}/> Pausa</> : <><Play size={28}/> Entrar no Fluxo</>}
                    </button>
                    <button onClick={() => { setTimeLeft(90*60); setIsTimerActive(false); }} className="p-6 theme-bg-input border theme-border rounded-[32px] theme-text-main hover:scale-105 transition-all"><RotateCcw size={28}/></button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
            <div className="animate-in fade-in space-y-10">
               <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">DopaMenu Neural</h2>
                  <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Regule sua dopamina estrategicamente.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DopaCard title="Entradas" icon={<Zap size={20}/>} label="Starter" color="text-orange-500" items={['5 min de sol', 'Beber água gelada', '10 polichinelos']} />
                  <DopaCard title="Prato Principal" icon={<Utensils size={20}/>} label="Main" color="text-blue-500" items={['Trabalho Focado', 'Leitura Técnica', 'Estudo Deep']} />
                  <DopaCard title="Acompanhamentos" icon={<Waves size={20}/>} label="Side" color="text-green-500" items={['Música Lo-Fi', 'Vela aromática', 'Postura correta']} />
                  <DopaCard title="Sobremesa" icon={<Sparkles size={20}/>} label="Dessert" color="text-purple-500" items={['15 min de Jogo', 'Redes Sociais (Timer)', 'Doce Saudável']} />
               </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="animate-in fade-in space-y-10">
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">Matriz Eisenhower</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
                  {[Priority.Q1, Priority.Q2, Priority.Q3, Priority.Q4].map(prio => (
                    <div key={prio} className={`p-6 rounded-[32px] border-2 theme-bg-card flex flex-col space-y-4 ${prio === Priority.Q1 ? 'border-red-500/20' : prio === Priority.Q2 ? 'border-orange-500/20' : prio === Priority.Q3 ? 'border-blue-500/20' : 'border-slate-500/20'}`}>
                       <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${prio === Priority.Q1 ? 'bg-red-500 text-white' : prio === Priority.Q2 ? 'bg-orange-500 text-white' : prio === Priority.Q3 ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'}`}>
                            {prio === Priority.Q1 ? 'Crítico' : prio === Priority.Q2 ? 'Estratégico' : prio === Priority.Q3 ? 'Delegar' : 'Eliminar'}
                          </span>
                       </div>
                       <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-[400px]">
                          {tasks.filter(t => t.priority === prio && !t.completed).map(task => (
                             <TaskCard key={task.id} task={task} compact onComplete={completeTask} onEdit={() => setEditingTaskId(task.id)} onDecompose={() => decomposeTaskAI(task.id)} />
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'habits' && (
             <div className="animate-in fade-in space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">Hábitos Atômicos</h2>
                   <button onClick={() => {
                     const nh: Habit = { id: crypto.randomUUID(), text: "Novo Hábito", anchor: "Âncora", tinyAction: "Ação", streak: 0, lastCompleted: null, completedDates: [] };
                     setHabits([nh, ...habits]);
                   }} className="p-3 bg-orange-600 text-white rounded-2xl"><Plus size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {habits.map(h => (
                     <div key={h.id} className="p-6 theme-bg-card border theme-border rounded-[32px] space-y-4 group">
                        <div className="flex justify-between">
                           <div className="flex items-center gap-2"><Flame className="text-orange-500" size={18}/> <span className="text-xs font-black uppercase theme-text-main">{h.text}</span></div>
                           <button onClick={() => setHabits(habits.filter(x => x.id !== h.id))} className="opacity-0 group-hover:opacity-100 p-1 text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <p className="text-[10px] theme-text-muted italic">Se {h.anchor}, então eu {h.tinyAction}.</p>
                        <button 
                          onClick={() => completeHabit(h.id)}
                          disabled={h.lastCompleted === new Date().toISOString().split('T')[0]}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${h.lastCompleted === new Date().toISOString().split('T')[0] ? 'bg-green-600/10 text-green-500' : 'bg-orange-600 text-white shadow-glow-orange'}`}
                        >
                          {h.lastCompleted === new Date().toISOString().split('T')[0] ? 'Batido Hoje' : 'Marcar Vitória'}
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Total Sinapses" value={points} icon={<BrainIcon/>} sub="XP Acumulado"/>
                  <StatCard label="Tarefas Concluídas" value={tasks.filter(t => t.completed).length} icon={<CheckCircle/>} sub="Foco Realizado"/>
                  <StatCard label="Melhor Combo" value={`${habits.reduce((acc, h) => Math.max(acc, h.streak), 0)} d`} icon={<Flame/>} sub="Sequência Atual"/>
               </div>
               <div className="p-10 theme-bg-card border theme-border rounded-[48px] flex flex-col items-center justify-center space-y-4">
                  <Activity size={48} className="text-orange-500 opacity-20"/>
                  <p className="text-xs font-bold theme-text-muted uppercase tracking-widest">Análise Preditiva em Breve...</p>
               </div>
            </div>
          )}

        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full theme-bg-sidebar backdrop-blur-2xl border-t theme-border z-[60] flex overflow-x-auto no-scrollbar px-4 py-2 justify-between items-center shadow-2xl">
        <MobIcon icon={<ListTodo/>} label="Input" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
        <MobIcon icon={<Timer/>} label="Fluxo" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
        <MobIcon icon={<LayoutGrid/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
        <MobIcon icon={<TrendingUp/>} label="Status" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
        <MobIcon icon={<Binary/>} label="Mods" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
      </nav>

      {editingTaskId && <TaskEditor task={editingTask} onClose={() => setEditingTaskId(null)} onUpdate={updateTaskDetails} onComplete={completeTask} onDelete={deleteTask} />}
    </div>
  );
};

const TaskCard = ({ task, onComplete, onEdit, onDecompose, compact = false }: any) => (
  <div className={`p-4 rounded-3xl theme-bg-card border theme-border flex flex-col gap-3 transition-all hover:scale-[1.01] group relative`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <button onClick={() => onComplete(task.id)} className={`w-6 h-6 rounded-lg border-2 theme-border flex items-center justify-center transition-all ${task.completed ? 'bg-green-600 border-green-600 text-white' : 'hover:border-orange-500'}`}>
          {task.completed && <Check size={14}/>}
        </button>
        <div className="flex flex-col">
          <span className={`text-xs font-black uppercase theme-text-main truncate tracking-tighter ${task.completed ? 'line-through opacity-40' : ''}`}>{task.text}</span>
          {!compact && <span className={`text-[8px] font-bold uppercase tracking-widest ${task.energy === 'Baixa' ? 'text-green-500' : task.energy === 'Média' ? 'text-yellow-500' : 'text-red-500'}`}>Energia: {task.energy}</span>}
        </div>
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
         {task.isRefining ? <Loader2 size={16} className="animate-spin text-orange-500"/> : (
           <>
            <button onClick={onDecompose} className="p-2 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500"><BrainCircuit size={14}/></button>
            <button onClick={onEdit} className="p-2 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500"><Edit3 size={14}/></button>
           </>
         )}
      </div>
    </div>
    {task.subtasks?.length > 0 && (
      <div className="pl-9 space-y-1.5 border-l-2 theme-border border-dashed ml-3 py-1">
        {task.subtasks.map((st: string, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600/40"></div>
            <span className="text-[10px] theme-text-muted font-medium">{st}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TaskEditor = ({ task, onClose, onUpdate, onComplete, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-2 theme-border rounded-[48px] p-10 space-y-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-orange-500/20">
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-orange-500"/>
            <h2 className="text-2xl font-black italic uppercase text-orange-600 tracking-tighter">Neuro-Ajuste</h2>
          </div>
          <button onClick={onClose} className="p-2 theme-text-muted hover:text-white"><X size={28}/></button>
       </div>
       <div className="space-y-6">
          <input className="w-full theme-bg-input p-5 rounded-2xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none" value={task.text} onChange={e => onUpdate(task.id, {text: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <select className="w-full theme-bg-input p-4 rounded-xl font-bold theme-text-main border theme-border uppercase text-[10px]" value={task.priority} onChange={e => onUpdate(task.id, {priority: e.target.value as Priority})}>
                <option value={Priority.Q1}>Urgente & Importante</option>
                <option value={Priority.Q2}>Estratégico</option>
                <option value={Priority.Q3}>Delegar</option>
                <option value={Priority.Q4}>Eliminar</option>
             </select>
             <select className="w-full theme-bg-input p-4 rounded-xl font-bold theme-text-main border theme-border uppercase text-[10px]" value={task.energy} onChange={e => onUpdate(task.id, {energy: e.target.value as any})}>
                <option value="Baixa">Energia Baixa</option>
                <option value="Média">Energia Média</option>
                <option value="Alta">Energia Alta</option>
             </select>
          </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { onComplete(task.id); onClose(); }} className="py-5 bg-green-600 text-white font-black uppercase rounded-[24px] shadow-glow-green text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all"><Check size={18}/> Concluir</button>
          <button onClick={() => { onDelete(task.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[24px] border border-red-500/20 text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/> Excluir</button>
       </div>
    </div>
  </div>
);

const DopaCard = ({ title, icon, label, color, items }: any) => (
  <div className="p-6 theme-bg-card border theme-border rounded-[32px] space-y-4">
     <div className="flex items-center gap-3">
        <div className={`w-10 h-10 theme-bg-input rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div>
           <h3 className="text-xs font-black uppercase theme-text-main">{title}</h3>
           <span className="text-[8px] font-bold uppercase theme-text-muted">{label}</span>
        </div>
     </div>
     <ul className="space-y-2">
        {items.map((it: string, i: number) => (
           <li key={i} className="text-[10px] font-bold theme-text-muted flex items-center gap-2">
              <ChevronRight size={10} className="text-orange-500"/> {it}
           </li>
        ))}
     </ul>
  </div>
);

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange' : 'theme-text-muted hover:bg-black/5'}`}>{icon} {label}</button>
);

const MobIcon = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-2 transition-all ${active ? 'theme-text-main' : 'theme-text-muted'}`}>
     <div className={`p-2 rounded-xl transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange scale-110' : 'theme-bg-input/30'}`}>{icon}</div>
     <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, sub }: any) => (
  <div className="p-6 theme-bg-card border-2 theme-border rounded-[32px] flex items-center gap-5">
     <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">{icon}</div>
     <div>
        <p className="text-[10px] font-black uppercase theme-text-muted tracking-widest">{label}</p>
        <div className="text-2xl font-black italic theme-text-main tracking-tighter">{value}</div>
        <p className="text-[8px] font-bold text-orange-500 uppercase">{sub}</p>
     </div>
  </div>
);

const SynapseLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" /><circle cx="16" cy="16" r="6" stroke="#f97316" strokeWidth="2.5"/><circle cx="16" cy="16" r="3" fill="#f97316"/><path d="M16 16L26 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="6" r="2.5" fill="#ef4444"/>
  </svg>
);

const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'u1', name: 'Decompositor IA v2', description: 'Decompõe tarefas em 8 passos.', cost: 500, unlocked: false, category: 'AI', icon: 'Wand2' },
  { id: 'u2', name: 'Timer de Dopamina', description: 'Visualização ultra-colorida no timer.', cost: 1000, unlocked: false, category: 'Focus', icon: 'Zap' },
  { id: 'u3', name: 'Aura Estética', description: 'Habilita temas visuais avançados.', cost: 2000, unlocked: false, category: 'Visual', icon: 'Palette' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Primeira Sinapse', description: 'Completou a primeira tarefa.', icon: 'Zap', unlockedAt: null },
  { id: 'a2', title: 'Mestre do Fluxo', description: 'Completou um ciclo de 90min.', icon: 'Timer', unlockedAt: null },
];

export default App;
