
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
  BLOCK_SYNC: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
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
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dashboard'>('capture');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timebox, setTimebox] = useState<TimeboxEntry[]>([]);
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

  const playAudio = useCallback((url: string) => {
    if (!isSoundEnabled) return;
    new Audio(url).play().catch(() => {});
  }, [isSoundEnabled]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setPoints(0); setTasks([]); setHabits([]); setTimebox([]); setRecurringTasks([]);
        setSyncStatus('none');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setSyncStatus('syncing');
    const unsubscribe = syncService.subscribeToUserData(user.uid, (data) => {
      if (data) {
        if (data.points !== undefined) setPoints(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.recurringTasks) setRecurringTasks(data.recurringTasks);
        if (data.habits) setHabits(data.habits);
        if (data.timebox) setTimebox(data.timebox);
        if (data.upgrades) setUpgrades(data.upgrades);
        if (data.achievements) setAchievements(data.achievements);
      }
      setSyncStatus('synced');
      setIsDataLoaded(true);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isDataLoaded || !user) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const data = { tasks, recurringTasks, habits, points, upgrades, achievements, timebox };
      const success = await syncService.pushData(user.uid, data);
      setSyncStatus(success ? 'synced' : 'error');
    }, 1500);
  }, [tasks, recurringTasks, habits, points, upgrades, achievements, timebox, user, isDataLoaded]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try { 
      await signInWithPopup(auth, googleProvider); 
    } catch (e: any) { 
      console.error("Login Error", e);
      if (e.code === 'auth/configuration-not-found') {
        setAuthError("O Provedor Google não está ativado. Vá no Console do Firebase > Authentication > Sign-in method e ative o Google.");
      } else {
        setAuthError("Erro ao entrar: " + e.message);
      }
    }
  };

  const handleLogout = async () => { await signOut(auth); setShowMobileDrawer(false); };

  useEffect(() => {
    if (!isDarkMode) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
  }, [isDarkMode]);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('neuro-sound-enabled', String(newState));
  };

  const toggleDarkMode = () => {
    const newState = !isDarkMode;
    setIsDarkMode(newState);
    localStorage.setItem('neuro-dark-mode', String(newState));
  };

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

  const addHabit = () => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      text: "Novo Hábito",
      anchor: "Depois de...",
      tinyAction: "Eu vou...",
      streak: 0,
      lastCompleted: null,
      completedDates: []
    };
    setHabits([newHabit, ...habits]);
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
            <p className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Neuro-Perfil</p>
            <div className="flex gap-2">
              <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500">{isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
              <button onClick={toggleSound} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500">{isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
            </div>
         </div>
         {user ? (
           <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-orange-500/20" alt="User" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black truncate theme-text-main uppercase">{user.displayName}</span>
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">XP: {points}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 text-red-500"><LogOut size={12}/> Encerrar Sessão</button>
           </div>
         ) : (
           <button onClick={handleGoogleLogin} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-glow-orange hover:scale-105 transition-all flex items-center justify-center gap-2"><Send size={14}/> Entrar com Google</button>
         )}
      </div>

      <div className="p-4 theme-bg-input border rounded-3xl space-y-3">
        <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest text-center">Bateria Biológica</p>
        <div className="flex justify-between items-center gap-2">
          {['Baixa', 'Média', 'Alta'].map(ev => (
            <button key={ev} onClick={() => setUserEnergy(ev as any)} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${userEnergy === ev ? 'bg-orange-600/10 border-orange-500/30 shadow-glow-orange scale-110' : 'opacity-40 hover:opacity-100'}`}>
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
             <p className="text-xs font-bold theme-text-muted uppercase tracking-widest leading-relaxed">Domine seu córtex pré-frontal com inteligência neural avançada.</p>
           </div>

           {authError && (
             <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-bold leading-relaxed uppercase">
                <ShieldAlert size={16} className="mx-auto mb-2"/>
                {authError}
             </div>
           )}

           <button onClick={handleGoogleLogin} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase shadow-glow-orange hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-6 h-6 bg-white p-1 rounded-full" alt="G" />
             Ativar Nuvem Neural
           </button>
           <p className="text-[9px] font-black uppercase theme-text-muted opacity-50">Sincronização Firebase v3.0 | 2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${!isDarkMode ? 'light-mode' : ''}`}>
      <header className="md:hidden sticky top-0 left-0 w-full theme-bg-sidebar backdrop-blur-xl border-b z-[60] flex items-center justify-between px-6 py-4">
         <div className="flex items-center gap-2"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
         <button onClick={() => setShowMobileDrawer(true)} className="p-2.5 theme-bg-input theme-border border rounded-xl theme-text-main relative">
            <User size={20}/>
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-700'}`}></div>
         </button>
      </header>

      {showMobileDrawer && (
        <div className="fixed inset-0 z-[100] md:hidden animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileDrawer(false)}></div>
           <div className="absolute right-0 top-0 h-full w-[85%] theme-bg-sidebar border-l theme-border shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-black uppercase italic tracking-tighter theme-text-main">Status Cloud</h2>
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
          <NavBtn icon={<Timer/>} label="Executar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
          <NavBtn icon={<LayoutGrid/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
          <NavBtn icon={<RefreshCw/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
          <NavBtn icon={<CalendarRange/>} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')}/>
          <NavBtn icon={<TrendingUp/>} label="Status" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
          <NavBtn icon={<Binary/>} label="Mods" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 relative">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {activeTab === 'capture' && (
            <div className="min-h-[70vh] md:min-h-[80vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange"><BrainIcon className="text-orange-500" size={32}/></div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Captura Neural</h2>
                <p className="text-[10px] md:text-[11px] font-black theme-text-muted uppercase tracking-[0.3em]">Externalize o ruído cerebral agora.</p>
              </div>
              <form onSubmit={handleSmartCapture} className="relative max-w-2xl mx-auto w-full px-2">
                <div className="p-5 md:p-8 rounded-[32px] md:rounded-[48px] border-2 md:border-4 transition-all duration-500 theme-bg-card border-slate-800 focus-within:border-orange-600 shadow-glow-orange/20">
                  <div className="flex items-center gap-3">
                    <input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-xl md:text-3xl font-black theme-text-main" placeholder="No que você está pensando?" />
                    <button type="submit" className="w-12 h-12 md:w-16 md:h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-glow-orange text-white"><Plus size={24}/></button>
                  </div>
                </div>
              </form>
              <div className="max-w-xl mx-auto w-full mt-10 space-y-3 px-2">
                {tasks.filter(t => !t.completed).slice(0, 5).map(t => (
                  <div key={t.id} className="p-4 rounded-2xl theme-bg-card border theme-border flex items-center justify-between animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {t.isRefining ? <Loader2 className="animate-spin text-orange-500 flex-shrink-0" size={16}/> : <CheckCircle2 className="theme-text-muted opacity-40 flex-shrink-0" size={16}/>}
                      <span className="text-xs font-bold uppercase theme-text-main truncate">{t.text}</span>
                    </div>
                    {!t.isRefining && (
                       <div className="flex gap-1">
                          <button onClick={() => completeTask(t.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl"><Check size={14}/></button>
                          <button onClick={() => setEditingTaskId(t.id)} className="p-2 theme-text-muted hover:text-orange-500 rounded-xl"><Edit3 size={14}/></button>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-in fade-in slide-in-from-bottom-10 space-y-12">
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Fluxo Ultradiano</h2>
                  <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Proteja seus 90 minutos de atenção profunda.</p>
               </div>
               <div className="p-10 md:p-20 theme-bg-card rounded-[64px] border theme-border flex flex-col items-center justify-center space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <div className="text-8xl md:text-[12rem] font-black italic tracking-tighter tabular-nums theme-text-main drop-shadow-2xl">{formatTime(timeLeft)}</div>
                  <div className="flex gap-6 z-10">
                    <button onClick={() => setIsTimerActive(!isTimerActive)} className="px-12 py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase flex items-center gap-4 shadow-glow-orange text-xl">
                      {isTimerActive ? <><Pause size={28}/> Pausa</> : <><Play size={28}/> Entrar no Fluxo</>}
                    </button>
                    <button onClick={() => { setTimeLeft(90*60); setIsTimerActive(false); }} className="p-6 theme-bg-input border theme-border rounded-[32px] theme-text-main hover:scale-105 transition-all"><RotateCcw size={28}/></button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="animate-in fade-in space-y-10">
               <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Matriz de Eisenhower</h2>
                    <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">IA-Categorized: Foco no que realmente importa.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[600px]">
                  {[Priority.Q1, Priority.Q2, Priority.Q3, Priority.Q4].map(prio => (
                    <div key={prio} className={`p-6 rounded-[32px] border-2 theme-bg-card flex flex-col space-y-4 ${prio === Priority.Q1 ? 'border-red-500/20' : prio === Priority.Q2 ? 'border-orange-500/20' : prio === Priority.Q3 ? 'border-blue-500/20' : 'border-slate-500/20'}`}>
                       <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${prio === Priority.Q1 ? 'bg-red-500 text-white' : prio === Priority.Q2 ? 'bg-orange-500 text-white' : prio === Priority.Q3 ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'}`}>
                            {prio === Priority.Q1 ? 'Urgente & Importante' : prio === Priority.Q2 ? 'Estratégico' : prio === Priority.Q3 ? 'Delegar' : 'Eliminar'}
                          </span>
                          <span className="text-[9px] font-bold theme-text-muted">{tasks.filter(t => t.priority === prio && !t.completed).length} Tarefas</span>
                       </div>
                       <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 no-scrollbar">
                          {tasks.filter(t => t.priority === prio && !t.completed).map(task => (
                            <div key={task.id} className="p-3 theme-bg-input rounded-xl border theme-border flex items-center justify-between group">
                               <div className="flex items-center gap-3 overflow-hidden">
                                  <button onClick={() => completeTask(task.id)} className="w-5 h-5 rounded-md border-2 theme-border flex items-center justify-center hover:bg-green-500/20 hover:border-green-500"><Check size={12}/></button>
                                  <span className="text-[11px] font-bold theme-text-main truncate uppercase tracking-tighter">{task.text}</span>
                               </div>
                               <button onClick={() => setEditingTaskId(task.id)} className="opacity-0 group-hover:opacity-100 transition-all p-1 theme-text-muted"><MoreHorizontal size={14}/></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="animate-in fade-in space-y-10">
               <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Arquitetura de Hábitos</h2>
                    <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Atomic Habits: Âncora + Micro-Ação.</p>
                  </div>
                  <button onClick={addHabit} className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-glow-orange"><Plus size={16}/> Novo Hábito</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {habits.map(habit => (
                    <div key={habit.id} className="p-6 theme-bg-card border-2 theme-border rounded-[32px] space-y-4 group relative overflow-hidden">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-center">
                            <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500"><Flame size={20}/></div>
                            <div>
                               <h3 className="text-xs font-black uppercase theme-text-main">{habit.text}</h3>
                               <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Streak: {habit.streak} dias</p>
                            </div>
                          </div>
                          <button onClick={() => setHabits(habits.filter(h => h.id !== habit.id))} className="opacity-0 group-hover:opacity-100 p-1 text-red-500"><Trash2 size={14}/></button>
                       </div>
                       <button 
                         onClick={() => completeHabit(habit.id)}
                         disabled={habit.lastCompleted === new Date().toISOString().split('T')[0]}
                         className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 ${habit.lastCompleted === new Date().toISOString().split('T')[0] ? 'bg-green-600/20 text-green-500' : 'bg-orange-600 text-white shadow-glow-orange'}`}
                       >
                         {habit.lastCompleted === new Date().toISOString().split('T')[0] ? <><Check size={14}/> Batido Hoje</> : <><Zap size={14}/> Registrar Vitória</>}
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
                  <StatCard label="Combo Atual" value={`${habits.reduce((acc, h) => Math.max(acc, h.streak), 0)} d`} icon={<Flame/>} sub="Melhor Sequência"/>
               </div>
            </div>
          )}

          {activeTab === 'upgrades' && (
            <div className="animate-in fade-in space-y-10">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Loja de Mods Neurais</h2>
                  <div className="px-5 py-2 bg-orange-600/10 border border-orange-500/30 rounded-2xl text-orange-500 font-black text-xs">Saldo: {points} XP</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upgrades.map(mod => (
                    <div key={mod.id} className={`p-8 theme-bg-card border-2 rounded-[40px] space-y-6 flex flex-col justify-between transition-all ${mod.unlocked ? 'border-green-500/30 opacity-60' : 'theme-border hover:border-orange-500/50'}`}>
                       <div className="space-y-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mod.unlocked ? 'bg-green-500/10 text-green-500' : 'bg-orange-600/10 text-orange-500'}`}>
                             {mod.icon === 'Zap' ? <Zap size={28}/> : mod.icon === 'Palette' ? <Palette size={28}/> : <Wand2 size={28}/>}
                          </div>
                          <div>
                             <h3 className="text-lg font-black uppercase theme-text-main">{mod.name}</h3>
                             <p className="text-[10px] theme-text-muted uppercase font-bold tracking-widest">{mod.category}</p>
                          </div>
                          <p className="text-xs theme-text-muted">{mod.description}</p>
                       </div>
                       <button 
                         disabled={mod.unlocked || points < mod.cost}
                         onClick={() => {
                           setPoints(p => p - mod.cost);
                           setUpgrades(upgrades.map(u => u.id === mod.id ? {...u, unlocked: true} : u));
                           playAudio(SOUNDS.UPGRADE);
                         }}
                         className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${mod.unlocked ? 'bg-green-600/20 text-green-500 cursor-default' : points >= mod.cost ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800 theme-text-muted cursor-not-allowed'}`}
                       >
                         {mod.unlocked ? 'Desbloqueado' : `Comprar - ${mod.cost} XP`}
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'fixed' && (
             <div className="animate-in fade-in space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {['Morning', 'Day', 'Evening', 'Night'].map((period) => (
                    <div key={period} className="theme-bg-card border theme-border rounded-[40px] p-8 space-y-6">
                       <h3 className="text-lg font-black uppercase theme-text-main">{PERIOD_LABELS[period as DayPeriod]}</h3>
                       <div className="space-y-3">
                          {recurringTasks.filter(rt => rt.period === period).map(task => (
                            <div key={task.id} className="p-4 theme-bg-input border theme-border rounded-2xl flex items-center justify-between">
                               <span className="text-xs font-bold theme-text-main uppercase">{task.text}</span>
                            </div>
                          ))}
                          <button onClick={() => {
                            const nt: RecurringTask = { id: crypto.randomUUID(), text: "Nova Rotina", frequency: Frequency.DAILY, priority: Priority.Q2, energy: 'Média', completedDates: [], period: period as DayPeriod };
                            setRecurringTasks([...recurringTasks, nt]);
                          }} className="w-full py-4 border-2 border-dashed theme-border rounded-2xl theme-text-muted flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-500 transition-all text-[10px] font-black uppercase"><Plus size={14}/> Agendar</button>
                       </div>
                    </div>
                  ))}
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

const TaskEditor = ({ task, onClose, onUpdate, onComplete, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-2 theme-border rounded-[48px] p-10 space-y-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-orange-500/20">
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-orange-500"/>
            <h2 className="text-2xl font-black italic uppercase text-orange-600 tracking-tighter">Andaimação IA</h2>
          </div>
          <button onClick={onClose} className="p-2 theme-text-muted hover:text-white"><X size={28}/></button>
       </div>
       
       <div className="space-y-6">
          <input className="w-full theme-bg-input p-5 rounded-2xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none" value={task.text} onChange={e => onUpdate(task.id, {text: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <select className="w-full theme-bg-input p-4 rounded-xl font-bold theme-text-main border theme-border uppercase text-[10px]" value={task.priority} onChange={e => onUpdate(task.id, {priority: e.target.value as Priority})}>
                <option value={Priority.Q1}>Q1 - Crítico</option>
                <option value={Priority.Q2}>Q2 - Estratégico</option>
                <option value={Priority.Q3}>Q3 - Delegável</option>
                <option value={Priority.Q4}>Q4 - Baixo Valor</option>
             </select>
             <select className="w-full theme-bg-input p-4 rounded-xl font-bold theme-text-main border theme-border uppercase text-[10px]" value={task.energy} onChange={e => onUpdate(task.id, {energy: e.target.value as any})}>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
             </select>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-4 pt-4">
          <button onClick={() => { onComplete(task.id); onClose(); }} className="py-5 bg-green-600 text-white font-black uppercase rounded-[24px] shadow-glow-green text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all"><CheckSquare size={18}/> Concluir</button>
          <button onClick={() => { onDelete(task.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[24px] border border-red-500/20 text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/> Excluir</button>
       </div>
    </div>
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
