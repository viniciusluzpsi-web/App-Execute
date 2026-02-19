
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  Trash2, Star, CheckCircle, Info, Move,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Volume1, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope,
  Cloud, CloudOff, CloudSync, Mail, Rocket, BrainCog, StickyNote, ListChecks, Music, Activity, Star as StarIcon, Cpu,
  ChefHat, IceCream, Pizza, Cookie, ShieldAlert, FastForward, Filter, Settings, Fingerprint,
  Sunrise, Sunset, MoonStar, Briefcase, Heart, Edit3, Sparkle, Swords, Gem, Lock, Unlock, Zap as ZapBolt,
  History, Send, Brain as BrainIcon, LifeBuoy, FileText, Layers, Loader, ArrowUpRight, BookOpenCheck, Menu, User, LogOut, 
  MoreHorizontal, CheckSquare, ShieldCheck as Shield, Soup, Disc, Candy, CookingPot, Utensils as UtensilsIcon, Gift, 
  Zap as ZapIconBolt, Zap as SparkleBolt, TrendingDown, Gauge, HelpCircle as HelpIcon, ShoppingBag, Coins
} from 'lucide-react';
import { Priority, Task, Habit, RecurringTask, Frequency, BrainCapacity, DopamenuItem, DayPeriod, Reward, Achievement, TimeboxEntry } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import confetti from 'canvas-confetti';

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  UPGRADE: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CAPTURE: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

const DEFAULT_DOPAMENU: DopamenuItem[] = [
  { id: 'd1', label: 'Copo de Água Gelada', category: 'Starter', effort: 'Baixo', description: 'Hidratação rápida para despertar o sistema nervoso central.' },
  { id: 'd2', label: '5 Respirações Profundas', category: 'Starter', effort: 'Baixo', description: 'Ativação do sistema parassimpático para reduzir o cortisol.' },
  { id: 'd3', label: '2 Minutos de Sol', category: 'Starter', effort: 'Baixo', description: 'Reset do ciclo circadiano e produção de serotonina.' },
  { id: 'd4', label: 'Sessão de Foco Deep Work', category: 'Main', effort: 'Alto', description: 'Ouro da produtividade: flow sustentado por dopamina tônica.' },
  { id: 'd5', label: 'Exercício de Alta Intensidade', category: 'Main', effort: 'Alto', description: 'Liberação massiva de endorfinas para regulação emocional.' },
  { id: 'd6', label: 'Ouvir White Noise / Lo-Fi', category: 'Side', effort: 'Baixo', description: 'Redução de ruído cognitivo externo para o córtex.' },
  { id: 'd7', label: 'Trabalhar em Pé', category: 'Side', effort: 'Baixo', description: 'Aumento da perfusão sanguínea cerebral e alerta.' },
  { id: 'd8', label: 'Banho Quente Sensorial', category: 'Dessert', effort: 'Médio', description: 'Recompensa final para sinalizar o fim do gasto executivo.' },
  { id: 'd9', label: 'Leitura de Ficção', category: 'Dessert', effort: 'Baixo', description: 'Descompressão pré-frontal sem estímulo de luz azul.' },
];

const TUTORIAL_CONTENT = {
  general: {
    title: "Seja bem-vindo ao NeuroExecutor",
    steps: [
      { icon: <BrainIcon className="text-orange-500"/>, title: "Sua Prótese Cognitiva", desc: "Este sistema foi desenhado para apoiar seu córtex pré-frontal, gerenciando a carga mental e combatendo a paralisia de decisão." },
      { icon: <Coins className="text-yellow-500"/>, title: "Economia de Dopamina", desc: "Não dependa apenas da força de vontade. Ganhe XP pelo esforço e troque por recompensas reais que VOCÊ define no Shopping." },
      { icon: <LayoutGrid className="text-blue-500"/>, title: "Foco Estratégico", desc: "Use a Matriz de Eisenhower para separar o barulho do que realmente move sua vida. Arraste e solte para priorizar." }
    ]
  },
  capture: {
    title: "A Ciência da Captura",
    steps: [
      { icon: <Layers className="text-orange-500"/>, title: "Efeito Zeigarnik", desc: "Seu cérebro gasta energia segurando tarefas inacabadas. 'Capture' tudo para liberar RAM mental." },
      { icon: <Cpu className="text-blue-500"/>, title: "Refino Assistido", desc: "Nossa IA ajuda a decompor ideias complexas em passos ridículos de simples, quebrando a resistência neural inicial." }
    ]
  },
  plan: {
    title: "Matriz Eisenhower",
    steps: [
      { icon: <Move className="text-orange-500"/>, title: "Arrastar e Soltar", desc: "Mova tarefas entre quadrantes para refletir seu estado atual. A priorização visual reduz o cansaço executivo." },
      { icon: <ShieldAlert className="text-red-500"/>, title: "Zona de Stress vs Fluxo", desc: "Tente manter o Q1 (Urgente) vazio e o Q2 (Estratégico) cheio para uma dopamina sustentada." }
    ]
  },
  execute: {
    title: "Modo Executivo",
    steps: [
      { icon: <Clock className="text-orange-500"/>, title: "Timeboxing", desc: "Dê um 'endereço no tempo' para suas tarefas. Se não está no calendário, seu cérebro não confia que será feito." },
      { icon: <Waves className="text-cyan-500"/>, title: "Ciclos Ultradianos", desc: "Use o timer de 90 minutos. É o limite fisiológico para o foco profundo antes da queda de performance." }
    ]
  },
  habits: {
    title: "Arquitetura de Hábitos",
    steps: [
      { icon: <Anchor className="text-blue-500"/>, title: "Âncoras Neurais", desc: "Associe novos hábitos a gatilhos existentes. 'Se [Gatilho], então [Ação]' cria caminhos sinápticos fortes." }
    ]
  },
  fixed: {
    title: "Rotinas Organizacionais",
    steps: [
      { icon: <CalendarRange className="text-orange-500"/>, title: "Preditividade Cerebral", desc: "Diferente de hábitos, rotinas são blocos fixos para organizar tarefas que SE REPETEM (Diário, Semanal, Mensal). Elas servem para você NÃO precisar planejar o óbvio." }
    ]
  },
  rewards: {
    title: "Shopping de Dopamina",
    steps: [
      { icon: <ShoppingBag className="text-purple-500"/>, title: "Mimos Dopaminérgicos", desc: "Defina recompensas reais que te motivam (Café, Jogo, Descanso). O cérebro só repete comportamentos que são recompensados." }
    ]
  },
  dashboard: {
    title: "Auto-Monitoramento",
    steps: [
      { icon: <TrendingUp className="text-green-500"/>, title: "Meta-Cognição", desc: "Analise seus dados para ajustar sua carga cognitiva. Conhecer seus limites é a chave para a consistência." }
    ]
  },
  dopamenu: {
    title: "Cardápio de Dopamina",
    steps: [
      { icon: <UtensilsIcon className="text-purple-500"/>, title: "Regulação Consciente", desc: "Não use a dopamina 'barata' das redes sociais. Escolha estímulos que recarregam sua bateria cognitiva sem causar burnout." }
    ]
  }
};

const REWARD_ICONS: Record<string, React.ReactNode> = {
  'Gift': <Gift size={24}/>,
  'Coffee': <Coffee size={24}/>,
  'Game': <Activity size={24}/>,
  'Pizza': <Pizza size={24}/>,
  'IceCream': <IceCream size={24}/>,
  'Movie': <Play size={24}/>,
  'Music': <Music size={24}/>,
  'Heart': <Heart size={24}/>,
  'Star': <StarIcon size={24}/>,
  'Coins': <Coins size={24}/>
};

const DOPA_CATEGORIES: Record<string, { label: string, color: string, bg: string, icon: React.ReactNode, neuro: string }> = {
  Starter: { label: 'Entradas', color: 'text-green-500', bg: 'bg-green-500/10', icon: <Soup size={20} />, neuro: 'Micro-dose rápida.' },
  Main: { label: 'Pratos Principais', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <CookingPot size={20} />, neuro: 'Flow profundo.' },
  Side: { label: 'Acompanhamentos', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <Disc size={20} />, neuro: 'Regulação paralela.' },
  Dessert: { label: 'Sobremesas', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: <Candy size={20} />, neuro: 'Recompensa final.' }
};

const MATRIX_INSIGHTS: Record<Priority, { label: string, strategy: string, neuro: string, color: string }> = {
  [Priority.Q1]: { label: 'Crítico', strategy: 'Fazer Agora', neuro: 'Reduz o cortisol imediato.', color: 'red' },
  [Priority.Q2]: { label: 'Estratégico', strategy: 'Agendar', neuro: 'Onde a evolução acontece.', color: 'orange' },
  [Priority.Q3]: { label: 'Delegar', strategy: 'Minimizar', neuro: 'Ruído cognitivo. Proteja seu foco.', color: 'blue' },
  [Priority.Q4]: { label: 'Eliminar', strategy: 'Descartar', neuro: 'Lixo mental. Limpe seu sistema.', color: 'slate' }
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'none'>('none');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neuro-dark-mode') !== 'false');
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem('neuro-sound-enabled') !== 'false');
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'rewards' | 'dopamenu' | 'dashboard'>('capture');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timeboxEntries, setTimeboxEntries] = useState<TimeboxEntry[]>([]);
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  
  const [userEnergy, setUserEnergy] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [brainCapacity, setBrainCapacity] = useState<BrainCapacity>('Neutro');
  const [newTaskText, setNewTaskText] = useState("");
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [activeTutorial, setActiveTutorial] = useState<keyof typeof TUTORIAL_CONTENT | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingTimeboxId, setEditingTimeboxId] = useState<string | null>(null);
  const [editingDopaId, setEditingDopaId] = useState<string | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showTimeboxCreator, setShowTimeboxCreator] = useState(false);

  const timerRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const lastSyncHashRef = useRef<string>("");

  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#fb923c', '#fdba74', '#ffffff']
    });
  }, []);

  const playAudio = useCallback((url: string) => {
    if (!isSoundEnabled) return;
    new Audio(url).play().catch(() => {});
  }, [isSoundEnabled]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthChecking(false);
      if (!firebaseUser) {
        setIsDataLoaded(false);
        setPoints(0); setTasks([]); setHabits([]); setRecurringTasks([]); setTimeboxEntries([]); setDopamenuItems([]); setRewards([]);
        lastSyncHashRef.current = "";
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error: any) { console.error(error); }
  };

  const handleLogout = async () => { try { await signOut(auth); setShowMobileDrawer(false); } catch (error) { console.error(error); } };

  useEffect(() => {
    if (!user) return;
    setSyncStatus('syncing');
    const unsubscribe = syncService.subscribeToUserData(user.uid, (data) => {
      if (data) {
        const dataHash = JSON.stringify({ t: data.tasks, h: data.habits, p: data.points, r: data.recurringTasks, tb: data.timeboxEntries, dm: data.dopamenuItems, rw: data.rewards, welcome: data.hasSeenWelcome });
        if (dataHash === lastSyncHashRef.current) { setSyncStatus('synced'); setIsDataLoaded(true); return; }
        lastSyncHashRef.current = dataHash;
        if (data.points !== undefined) setPoints(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.recurringTasks) setRecurringTasks(data.recurringTasks);
        if (data.habits) setHabits(data.habits);
        if (data.timeboxEntries) setTimeboxEntries(data.timeboxEntries);
        
        // Inicializa com DopaMenu padrão se estiver vazio
        if (data.dopamenuItems && data.dopamenuItems.length > 0) {
          setDopamenuItems(data.dopamenuItems);
        } else {
          setDopamenuItems(DEFAULT_DOPAMENU);
        }

        if (data.rewards) setRewards(data.rewards);
        if (data.hasSeenWelcome !== undefined) {
           setHasSeenWelcome(data.hasSeenWelcome);
           if (!data.hasSeenWelcome) setActiveTutorial('general');
        } else {
           setHasSeenWelcome(false);
           setActiveTutorial('general');
        }
      } else {
        setDopamenuItems(DEFAULT_DOPAMENU);
        setHasSeenWelcome(false);
        setActiveTutorial('general');
      }
      setIsDataLoaded(true);
      setSyncStatus('synced');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isDataLoaded || !user) return;
    const currentHash = JSON.stringify({ t: tasks, h: habits, p: points, r: recurringTasks, tb: timeboxEntries, dm: dopamenuItems, rw: rewards, welcome: hasSeenWelcome });
    if (currentHash === lastSyncHashRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const success = await syncService.pushData(user.uid, { tasks, habits, points, recurringTasks, timeboxEntries, dopamenuItems, rewards, hasSeenWelcome });
      if (success) { lastSyncHashRef.current = currentHash; setSyncStatus('synced'); } else { setSyncStatus('error'); }
    }, 3000);
  }, [tasks, habits, points, recurringTasks, timeboxEntries, dopamenuItems, rewards, user, isDataLoaded, hasSeenWelcome]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0 && isTimerActive) { 
        setPoints(p => p + 500); 
        playAudio(SOUNDS.UPGRADE); 
        setIsTimerActive(false); 
        triggerCelebration();
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft, triggerCelebration]);

  const updateTaskDetails = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const updateRewardDetails = (id: string, updates: Partial<Reward>) => setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const updateHabitDetails = (id: string, updates: Partial<Habit>) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  const updateRoutineDetails = (id: string, updates: Partial<RecurringTask>) => setRecurringTasks(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const getWeekDays = () => {
    const days = []; const now = new Date(); const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) { const d = new Date(sunday); d.setDate(sunday.getDate() + i); days.push(d); }
    return days;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-2xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
      <div className="p-5 theme-bg-input border rounded-3xl space-y-4">
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Neural Link</p>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400">{isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
              <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400">{isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
            </div>
         </div>
         {user && (
           <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-orange-500/20 shadow-glow-orange" alt="U" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black truncate theme-text-main uppercase">{user.displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">XP: {points}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : 'bg-orange-500 animate-pulse'}`}></div>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 text-red-500"><LogOut size={12}/> Logout</button>
           </div>
         )}
      </div>
      <div className="p-4 theme-bg-input border rounded-3xl space-y-3">
        <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest text-center">Neuro-Estado</p>
        <div className="grid grid-cols-2 gap-2">
          {['Baixa', 'Média', 'Alta'].map(ev => (
            <button key={ev} onClick={() => setUserEnergy(ev as any)} className={`flex flex-col items-center p-2 rounded-xl transition-all border ${userEnergy === ev ? 'bg-orange-600/10 border-orange-500/30 scale-105' : 'opacity-40 hover:opacity-100 theme-border'}`}>
              <div className={ev === 'Baixa' ? 'text-red-500' : ev === 'Média' ? 'text-yellow-500' : 'text-green-500'}>
                {ev === 'Baixa' ? <BatteryLow size={14}/> : ev === 'Média' ? <BatteryMedium size={14}/> : <BatteryFull size={14}/>}
              </div>
              <span className="text-[7px] font-black uppercase mt-1">{ev} Energia</span>
            </button>
          ))}
          {['Exausto', 'Neutro', 'Hiperfocado'].map(cap => (
            <button key={cap} onClick={() => setBrainCapacity(cap as any)} className={`flex flex-col items-center p-2 rounded-xl transition-all border ${brainCapacity === cap ? 'bg-blue-600/10 border-blue-500/30 scale-105' : 'opacity-40 hover:opacity-100 theme-border'}`}>
              <div className={cap === 'Exausto' ? 'text-red-400' : cap === 'Neutro' ? 'text-blue-400' : 'text-purple-400'}>
                <Brain size={14}/>
              </div>
              <span className="text-[7px] font-black uppercase mt-1">{cap}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const statsData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0];
    }).reverse();
    const taskCounts = last7Days.map(date => ({
      date, completed: tasks.filter(t => t.date === date && t.completed).length, total: tasks.filter(t => t.date === date).length
    }));
    const totalCompleted = tasks.filter(t => t.completed).length;
    const averageCompletion = tasks.length > 0 ? (totalCompleted / tasks.length) * 100 : 0;
    const topHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    const routineConsistency = recurringTasks.length > 0 ? (recurringTasks.reduce((acc, r) => acc + r.completedDates.length, 0) / recurringTasks.length) : 0;
    return { last7Days, taskCounts, totalCompleted, averageCompletion, topHabitStreak, routineConsistency, cognitiveLoad: Math.min(tasks.filter(t => t.date === selectedDate && !t.completed).length * 15, 100) };
  }, [tasks, habits, recurringTasks, selectedDate]);

  if (isAuthChecking) return <div className="min-h-screen theme-bg-body flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen theme-bg-body flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-blue-600/5 pointer-events-none"></div>
        <div className="max-w-md w-full theme-bg-card border-2 theme-border p-12 rounded-[56px] shadow-2xl z-10 text-center space-y-8">
           <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange synapse-core"><Brain size={40} className="text-orange-600"/></div>
           <div className="space-y-2">
             <h1 className="text-4xl font-black italic uppercase text-orange-600 tracking-tighter">NeuroExecutor</h1>
             <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.3em]">Produtividade Cognitiva</p>
           </div>
           <button onClick={handleLogin} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase shadow-glow-orange hover:scale-105 transition-all flex items-center justify-center gap-3 tracking-widest text-xs">
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-5 h-5 bg-white p-1 rounded-full" alt="G" />
             Iniciar Sinapse
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 pb-24 md:pb-0 ${isDarkMode ? '' : 'light-mode'}`}>
      <header className="md:hidden sticky top-0 left-0 w-full theme-bg-sidebar backdrop-blur-xl border-b z-[60] flex items-center justify-between px-6 py-4">
         <div className="flex items-center gap-2"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : 'bg-orange-500 animate-pulse'}`}></div>
            <button onClick={() => setShowMobileDrawer(true)} className="p-2.5 theme-bg-input border rounded-xl theme-text-main"><User size={20}/></button>
         </div>
      </header>

      {showMobileDrawer && (
        <div className="fixed inset-0 z-[100] md:hidden">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileDrawer(false)}></div>
           <div className="absolute right-0 top-0 h-full w-[85%] theme-bg-sidebar border-l theme-border p-8 flex flex-col animate-in slide-in-from-right duration-300">
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
          <NavBtn icon={<UtensilsIcon/>} label="DopaMenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')}/>
          <NavBtn icon={<ShoppingBag/>} label="Shopping" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}/>
          <NavBtn icon={<TrendingUp/>} label="Stats" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          
          <div className="sticky top-0 z-40 py-2 theme-bg-body">
            <div className="flex items-center gap-2 p-1 bg-slate-900/50 backdrop-blur-xl rounded-[32px] border theme-border overflow-x-auto no-scrollbar shadow-xl">
              {getWeekDays().map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <button key={idx} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center min-w-[50px] md:min-w-[64px] py-2.5 px-1 rounded-2xl transition-all ${isSelected ? 'bg-orange-600 text-white shadow-glow-orange scale-105' : 'theme-text-muted hover:bg-white/5'}`}>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter opacity-70 mb-0.5">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="text-sm md:text-lg font-black italic">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'dashboard' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Status Neural</h2>
                      <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Insights Meta-Cognitivos</p>
                   </div>
                   <button onClick={() => setActiveTutorial('dashboard')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatBox label="Nível Neural" value={`LVL ${Math.floor(points / 5000) + 1}`} icon={<Cpu size={20}/>} color="text-orange-500" subValue={`${points % 5000} / 5000 XP`}/>
                   <StatBox label="Carga Cognitiva" value={`${statsData.cognitiveLoad}%`} icon={<Brain size={20}/>} color={statsData.cognitiveLoad > 80 ? "text-red-500" : "text-green-500"} subValue={statsData.cognitiveLoad > 80 ? "Risco de Burnout" : "Estado Saudável"}/>
                   <StatBox label="Consistência" value={`${statsData.topHabitStreak} d`} icon={<Flame size={20}/>} color="text-orange-600" subValue="Maior sequência atual"/>
                </div>
                <div className="p-8 md:p-12 theme-bg-card border-2 theme-border rounded-[48px] md:rounded-[64px] space-y-8 shadow-2xl relative overflow-hidden group">
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black italic uppercase theme-text-main flex items-center gap-3"><BarChart3 className="text-orange-500" size={24}/> Fluxo Semanal</h3>
                         <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">Sinapses concluídas nos últimos 7 dias</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-500"><TrendingUp size={16}/><span className="text-xl font-black italic">+{statsData.totalCompleted}</span></div>
                   </div>
                   <div className="h-64 md:h-80 w-full relative flex items-end justify-between px-4 pb-8 pt-4">
                      {statsData.taskCounts.map((day, idx) => {
                        const maxVal = Math.max(...statsData.taskCounts.map(d => d.completed), 1);
                        const height = (day.completed / maxVal) * 100;
                        const isToday = day.date === new Date().toISOString().split('T')[0];
                        return (
                          <div key={idx} className="flex flex-col items-center gap-4 group/bar relative flex-1">
                             <div className="relative w-full flex justify-center items-end h-48 md:h-64"><div className={`w-4 md:w-8 rounded-t-full transition-all duration-700 shadow-glow-orange relative ${isToday ? 'bg-orange-600' : 'bg-slate-700/50 group-hover/bar:bg-orange-500'}`} style={{ height: `${Math.max(height, 5)}%` }}><div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap shadow-2xl border theme-border">{day.completed} Sinapses</div></div></div>
                             <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-orange-500' : 'theme-text-muted'}`}>{new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'rewards' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Shopping Neural</h2>
                      <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Compre Mimos com XP</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setActiveTutorial('rewards')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <div className="px-6 py-4 theme-bg-card border-2 border-yellow-500/30 rounded-[32px] shadow-glow-orange flex items-center gap-3"><Coins className="text-yellow-500" size={24}/><div className="flex flex-col"><span className="text-2xl font-black theme-text-main italic leading-none">{points}</span><span className="text-[8px] font-black uppercase theme-text-muted">XP Disponível</span></div></div>
                      <button onClick={() => { const nr: Reward = { id: crypto.randomUUID(), name: "Nova Recompensa", cost: 1000, description: "O que você vai se dar por ser focado?", icon: 'Gift', redemptions: 0 }; setRewards([nr, ...rewards]); setEditingRewardId(nr.id); }} className="p-4 bg-orange-600 text-white rounded-3xl shadow-glow-orange hover:scale-110 active:scale-90 transition-all"><Plus size={28}/></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                   {rewards.map(reward => (
                     <div key={reward.id} className="p-6 md:p-10 theme-bg-card border-2 theme-border rounded-[48px] space-y-6 group relative overflow-hidden transition-all shadow-xl flex flex-col hover:border-orange-500/30" onClick={() => setEditingRewardId(reward.id)}>
                        <div className="flex justify-between items-start">
                           <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 shadow-glow-orange">
                              {REWARD_ICONS[reward.icon] || <Gift size={24}/>}
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setEditingRewardId(reward.id); }} className="p-2 theme-text-muted hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16}/></button>
                        </div>
                        <div className="space-y-2 flex-1">
                           <h3 className="text-xl md:text-2xl font-black uppercase italic theme-text-main tracking-tighter leading-tight">{reward.name}</h3>
                           <p className="text-[10px] md:text-[11px] font-bold theme-text-muted leading-relaxed uppercase tracking-tight">{reward.description}</p>
                           <div className="flex items-center gap-2 pt-2"><span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg uppercase">Resgatado {reward.redemptions || 0}x</span></div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (points >= reward.cost) {
                              setPoints(p => p - reward.cost);
                              updateRewardDetails(reward.id, { redemptions: (reward.redemptions || 0) + 1 });
                              playAudio(SOUNDS.UPGRADE);
                              triggerCelebration();
                            }
                          }}
                          disabled={points < reward.cost}
                          className={`w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${points >= reward.cost ? 'bg-orange-600 text-white shadow-glow-orange hover:scale-105' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}
                        >
                           <Coins size={18}/> Resgatar ({reward.cost} XP)
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'plan' && (
             <div className="animate-in fade-in space-y-8 md:space-y-12 px-2 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Matriz Eisenhower</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Arraste para ajustar seu foco</p></div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setActiveTutorial('plan')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <div className="flex items-center gap-4 p-4 theme-bg-card border theme-border rounded-[32px] shadow-lg"><Brain size={24} className="text-orange-500 animate-pulse"/><p className="text-[10px] font-bold theme-text-muted max-w-[200px] leading-tight uppercase">Arraste as sinapses para regular sua carga cognitiva.</p></div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-h-[700px]">
                   {[Priority.Q1, Priority.Q2, Priority.Q3, Priority.Q4].map(prio => {
                     const insight = MATRIX_INSIGHTS[prio];
                     const quadrantTasks = tasks.filter(t => t.priority === prio && !t.completed && t.date === selectedDate);
                     return (
                       <div 
                         key={prio} 
                         onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-orange-500/50'); }}
                         onDragLeave={(e) => { e.currentTarget.classList.remove('border-orange-500/50'); }}
                         onDrop={(e) => { 
                           e.preventDefault(); 
                           e.currentTarget.classList.remove('border-orange-500/50');
                           if (draggedTaskId) { updateTaskDetails(draggedTaskId, { priority: prio }); setDraggedTaskId(null); }
                         }}
                         className={`relative p-6 md:p-10 rounded-[56px] border-2 theme-bg-card flex flex-col space-y-6 transition-all hover:shadow-2xl overflow-hidden group ${prio === Priority.Q1 ? 'border-red-500/20 shadow-red-500/5' : prio === Priority.Q2 ? 'border-orange-500/20 shadow-orange-500/5' : prio === Priority.Q3 ? 'border-blue-500/20 shadow-blue-500/5' : 'border-slate-500/20 opacity-70 grayscale hover:grayscale-0'}`}
                       >
                          <div className={`absolute -top-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-10 pointer-events-none ${prio === Priority.Q1 ? 'bg-red-500' : prio === Priority.Q2 ? 'bg-orange-500' : prio === Priority.Q3 ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                          <div className="flex justify-between items-start z-10">
                             <div className="space-y-1"><span className={`text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg inline-block tracking-widest ${prio === Priority.Q1 ? 'bg-red-600 text-white' : prio === Priority.Q2 ? 'bg-orange-600 text-white' : prio === Priority.Q3 ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>{insight.label}</span><p className={`text-[18px] md:text-[22px] font-black italic uppercase tracking-tighter leading-none mt-2 ${prio === Priority.Q1 ? 'text-red-500' : prio === Priority.Q2 ? 'text-orange-500' : prio === Priority.Q3 ? 'text-blue-500' : 'theme-text-muted'}`}>{insight.strategy}</p></div>
                             <button onClick={() => { const nt: Task = { id: crypto.randomUUID(), text: "", priority: prio, energy: 'Média', capacityNeeded: 'Neutro', completed: false, subtasks: [], date: selectedDate, createdAt: Date.now() }; setTasks([nt, ...tasks]); setEditingTaskId(nt.id); }} className="p-4 theme-bg-input rounded-3xl hover:bg-orange-600 hover:text-white transition-all active:scale-90 border theme-border shadow-md"><Plus size={24}/></button>
                          </div>
                          <div className="p-4 theme-bg-input/30 rounded-3xl border border-dashed theme-border"><p className="text-[10px] font-bold theme-text-muted uppercase leading-relaxed tracking-tight"><Info size={12} className="inline mr-1 mb-0.5 opacity-50"/> {insight.neuro}</p></div>
                          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1 max-h-[500px]">
                             {quadrantTasks.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed theme-border rounded-[40px] text-center px-6"><Target size={32}/><p className="text-[9px] font-black uppercase mt-4 tracking-widest leading-relaxed">Arraste uma tarefa aqui</p></div> ) : quadrantTasks.map(task => ( 
                                <div key={task.id} draggable onDragStart={() => setDraggedTaskId(task.id)} className="cursor-grab active:cursor-grabbing">
                                  <TaskCard task={task} compact onComplete={(id: string) => { 
                                    updateTaskDetails(id, {completed: true}); 
                                    setPoints(p => p + 100); 
                                    playAudio(SOUNDS.TASK_COMPLETE);
                                    triggerCelebration();
                                  }} onEdit={() => setEditingTaskId(task.id)} /> 
                                </div>
                             ))}
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>
          )}

          {activeTab === 'fixed' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-20">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Rotinas Fixas</h2>
                      <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Gestão de Afazeres Recorrentes</p>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setActiveTutorial('fixed')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <button onClick={() => { const nr: RecurringTask = { id: crypto.randomUUID(), text: "Nova Rotina", frequency: Frequency.DAILY, energy: 'Média', anchor: "", description: "", lastCompleted: null, completedDates: [] }; setRecurringTasks([nr, ...recurringTasks]); setEditingRoutineId(nr.id); }} className="p-5 bg-orange-600 text-white rounded-3xl shadow-glow-orange hover:scale-110 active:scale-95 transition-all"><Plus size={28}/></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {recurringTasks.map(r => (
                     <div key={r.id} className="p-8 theme-bg-card border-2 theme-border rounded-[40px] space-y-6 group relative overflow-hidden transition-all hover:border-orange-500/40 cursor-pointer shadow-xl flex flex-col" onClick={() => setEditingRoutineId(r.id)}>
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-500/10 px-3 py-1 rounded-lg tracking-widest">{r.frequency}</span>
                              <h3 className="text-xl md:text-2xl font-black uppercase italic theme-text-main leading-tight">{r.text}</h3>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setEditingRoutineId(r.id); }} className="p-2.5 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500"><Edit3 size={18}/></button>
                        </div>
                        <div className="flex-1 p-5 theme-bg-input rounded-3xl border theme-border space-y-3">
                           <div className="flex items-center gap-2 opacity-60"><Anchor size={14} className="text-orange-500"/><span className="text-[10px] font-black uppercase tracking-widest">{r.anchor || 'Sem âncora fixada'}</span></div>
                           <p className="text-[11px] font-bold theme-text-muted leading-relaxed uppercase tracking-tight">{r.description || 'Nenhuma instrução adicional.'}</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (r.lastCompleted !== selectedDate) {
                              updateRoutineDetails(r.id, { lastCompleted: selectedDate, completedDates: [...r.completedDates, selectedDate] });
                              setPoints(p => p + 200);
                              playAudio(SOUNDS.HABIT_COMPLETE);
                              triggerCelebration();
                            }
                          }}
                          disabled={r.lastCompleted === selectedDate}
                          className={`w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 ${r.lastCompleted === selectedDate ? 'bg-green-600/10 text-green-500 border border-green-600/30' : 'bg-orange-600 text-white shadow-glow-orange hover:scale-105'}`}
                        >
                           {r.lastCompleted === selectedDate ? <><CheckCircle className="inline mr-2" size={18}/> Organizado Hoje</> : 'Marcar como Feito'}
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'capture' && (
            <div className="min-h-[70vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                 <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange synapse-core"><BrainIcon className="text-orange-500" size={32}/></div>
                 <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Captura Neural</h2>
                 <button onClick={() => setActiveTutorial('capture')} className="mx-auto flex items-center gap-2 text-[10px] font-black uppercase theme-text-muted hover:text-orange-500 transition-all tracking-widest"><HelpIcon size={14}/> Por que capturar?</button>
              </div>
              <form onSubmit={async (e) => { e.preventDefault(); const taskInput = newTaskText.trim(); if (!taskInput || !user) return; const tempId = crypto.randomUUID(); const tempTask: Task = { id: tempId, text: taskInput, priority: Priority.Q2, energy: 'Média', capacityNeeded: 'Neutro', completed: false, subtasks: [], date: selectedDate, createdAt: Date.now(), isRefining: true }; setTasks(prev => [tempTask, ...prev]); setNewTaskText(""); setPoints(p => p + 20); playAudio(SOUNDS.CAPTURE); try { const parsed = await geminiService.parseNaturalTask(taskInput); updateTaskDetails(tempId, { priority: (parsed.priority as Priority) || Priority.Q2, energy: (parsed.energy as any) || 'Média', subtasks: parsed.subtasks || [], isRefining: false }); } catch { updateTaskDetails(tempId, { isRefining: false }); } }} className="relative max-w-2xl mx-auto w-full px-2">
                <div className="p-6 md:p-10 rounded-[40px] border-2 theme-bg-card theme-border focus-within:border-orange-600 shadow-glow-orange/10 transition-all"><div className="flex items-center gap-4"><input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-xl md:text-3xl font-black theme-text-main placeholder:opacity-20" placeholder="Nova sinapse..." /><button type="submit" className="w-14 h-14 bg-orange-600 rounded-3xl flex items-center justify-center shadow-glow-orange text-white hover:scale-110 active:scale-90 transition-all"><Plus size={32}/></button></div></div>
              </form>
            </div>
          )}

          {activeTab === 'habits' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-20">
                <div className="flex justify-between items-center">
                   <div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Hábitos</h2></div>
                   <button onClick={() => setActiveTutorial('habits')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {habits.map(h => (
                     <div key={h.id} className="p-8 theme-bg-card border-2 theme-border rounded-[40px] space-y-6" onClick={() => setEditingHabitId(h.id)}>
                        <h3 className="text-xl font-black uppercase italic theme-text-main">{h.text}</h3>
                        <div className="flex items-center gap-2"><Flame className="text-orange-600" size={20}/><span className="text-2xl font-black">{h.streak} dias</span></div>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          updateHabitDetails(h.id, {streak: h.streak + 1, lastCompleted: selectedDate}); 
                          setPoints(p => p + 150); 
                          playAudio(SOUNDS.HABIT_COMPLETE);
                          triggerCelebration();
                        }} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase">Registrar</button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-in fade-in space-y-6 md:space-y-12 pb-20">
               <div className="flex justify-between items-center">
                  <div className="space-y-1">
                     <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Modo Executivo</h2>
                     <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Engajando Foco Profundo</p>
                  </div>
                  <button onClick={() => setActiveTutorial('execute')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div className="p-8 md:p-12 theme-bg-card rounded-[48px] md:rounded-[64px] border theme-border flex flex-col items-center justify-center space-y-10 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 opacity-10 pointer-events-none"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800"/><circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1000" strokeDashoffset={1000 - (timeLeft / (90*60) * 1000)} className="text-orange-600 transition-all duration-1000"/></svg></div>
                      <div className={`text-7xl md:text-9xl font-black italic tracking-tighter tabular-nums theme-text-main drop-shadow-2xl transition-transform duration-500 ${isTimerActive ? 'scale-110' : ''}`}>{formatTime(timeLeft)}</div>
                      <div className="flex gap-4 md:gap-6 z-10"><button onClick={() => setIsTimerActive(!isTimerActive)} className="px-8 md:px-12 py-4 md:py-5 bg-orange-600 text-white rounded-[24px] md:rounded-[32px] font-black uppercase flex items-center gap-3 shadow-glow-orange transition-all hover:scale-105 active:scale-95 text-base md:text-lg">{isTimerActive ? <Pause size={24}/> : <Play size={24}/>} {isTimerActive ? 'Pausa' : 'Entrar no Fluxo'}</button><button onClick={() => { setTimeLeft(90*60); setIsTimerActive(false); }} className="p-4 md:p-5 theme-bg-input border theme-border rounded-[24px] md:rounded-[32px] theme-text-main hover:bg-orange-600/10 active:scale-90 transition-all"><RotateCcw size={24}/></button></div>
                  </div>
                  <div className="theme-bg-card border theme-border rounded-[48px] md:rounded-[64px] p-8 md:p-12 space-y-8 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-center"><h3 className="text-xl md:text-2xl font-black uppercase italic theme-text-main flex items-center gap-3"><Clock className="text-orange-500" size={24}/> Timebox</h3><button onClick={() => setShowTimeboxCreator(true)} className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-glow-orange active:scale-90 transition-all"><Plus size={24}/></button></div>
                    <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-[400px] pr-2">
                       {timeboxEntries.map(entry => (
                          <div key={entry.id} className={`p-5 rounded-[32px] border-2 transition-all flex items-center gap-4 group cursor-pointer ${entry.completed ? 'bg-green-600/5 border-green-600/20 opacity-60 scale-95' : 'theme-bg-input border-transparent hover:border-orange-500/40 shadow-lg'}`} onClick={() => setEditingTimeboxId(entry.id)}>
                             <div className="flex flex-col items-center min-w-[65px] border-r theme-border pr-4"><span className="text-[12px] font-black theme-text-main">{entry.start}</span><span className="text-[9px] font-bold theme-text-muted">{entry.end}</span></div>
                             <div className="flex-1"><h4 className={`text-sm font-black uppercase tracking-tighter leading-tight ${entry.completed ? 'line-through theme-text-muted' : 'theme-text-main'}`}>{entry.activity}</h4></div>
                             <button onClick={(e) => { 
                                e.stopPropagation(); 
                                setTimeboxEntries(prev => prev.map(ev => ev.id === entry.id ? {...ev, completed: !ev.completed} : ev)); 
                                if(!entry.completed) {
                                  setPoints(p => p + 250);
                                  triggerCelebration();
                                }
                             }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${entry.completed ? 'bg-green-600 text-white' : 'theme-bg-body border theme-border text-orange-500'}`}><Check size={18}/></button>
                          </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">DopaMenu</h2>
                      <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Gestão Ética de Estímulos</p>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setActiveTutorial('dopamenu')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <button onClick={() => { const ni: DopamenuItem = { id: crypto.randomUUID(), label: "Nova Pausa", category: 'Starter', description: "", effort: 'Baixo' }; setDopamenuItems([ni, ...dopamenuItems]); setEditingDopaId(ni.id); }} className="p-5 bg-orange-600 text-white rounded-3xl shadow-glow-orange hover:scale-110 active:scale-95 transition-all"><Plus size={28}/></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                   {Object.entries(DOPA_CATEGORIES).map(([key, info]) => (
                     <div key={key} className={`p-6 md:p-8 rounded-[40px] theme-bg-card border-2 theme-border ${info.bg} flex flex-col space-y-6 shadow-xl`}>
                        <div className="flex justify-between items-start">
                           <div className={`p-3 rounded-2xl bg-white/5 ${info.color}`}>{info.icon}</div>
                        </div>
                        <div className="space-y-1">
                           <h3 className={`text-xl font-black uppercase italic ${info.color} leading-none`}>{info.label}</h3>
                           <p className="text-[8px] font-black uppercase theme-text-muted opacity-50 tracking-widest">{info.neuro}</p>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[400px]">
                           {dopamenuItems.filter(i => i.category === key).map(item => (
                             <div key={item.id} onClick={() => setEditingDopaId(item.id)} className="p-4 theme-bg-input rounded-2xl border theme-border cursor-pointer hover:border-orange-500/40 transition-all group">
                                <div className="flex justify-between items-center">
                                   <h4 className="text-[11px] font-black uppercase tracking-tight group-hover:theme-text-main transition-colors">{item.label}</h4>
                                   <ChevronRight size={12} className="theme-text-muted opacity-0 group-hover:opacity-100 transition-all"/>
                                </div>
                             </div>
                           ))}
                           {dopamenuItems.filter(i => i.category === key).length === 0 && (
                             <div className="py-10 text-center opacity-10 border-2 border-dashed theme-border rounded-2xl"><Plus size={20} className="mx-auto"/></div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full theme-bg-sidebar backdrop-blur-2xl border-t theme-border z-[60] flex overflow-x-auto no-scrollbar px-3 py-3 justify-between items-center shadow-2xl">
        <MobIcon icon={<ListTodo size={20}/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
        <MobIcon icon={<Timer size={20}/>} label="Executar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
        <MobIcon icon={<LayoutGrid size={20}/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
        <MobIcon icon={<RefreshCw size={20}/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
        <MobIcon icon={<ShoppingBag size={20}/>} label="Rewards" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}/>
        <MobIcon icon={<TrendingUp size={20}/>} label="Status" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
      </nav>

      {/* MODALS & EDITORS */}
      {activeTutorial && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
           <div className="w-full max-w-2xl theme-bg-card border-2 theme-border rounded-[48px] md:rounded-[64px] p-8 md:p-16 shadow-2xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 p-8"><button onClick={() => { setActiveTutorial(null); setHasSeenWelcome(true); }} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white transition-all"><X size={24}/></button></div>
              <div className="space-y-2">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic text-orange-600 tracking-tighter leading-none">{(TUTORIAL_CONTENT as any)[activeTutorial].title}</h2>
                 <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.3em]">Neuro-Arquitetura</p>
              </div>
              <div className="space-y-8">
                 {(TUTORIAL_CONTENT as any)[activeTutorial].steps.map((s: any, i: number) => (
                   <div key={i} className="flex gap-6 items-start group">
                      <div className="p-4 rounded-2xl theme-bg-input border theme-border group-hover:scale-110 transition-all">{s.icon}</div>
                      <div className="space-y-1">
                         <h3 className="text-lg md:text-xl font-black uppercase italic theme-text-main tracking-tight">{s.title}</h3>
                         <p className="text-sm md:text-base font-bold theme-text-muted tracking-tight leading-relaxed">{s.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button onClick={() => { setActiveTutorial(null); setHasSeenWelcome(true); }} className="w-full py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase text-xs shadow-glow-orange hover:scale-105 active:scale-95 transition-all">Sincronizar</button>
           </div>
        </div>
      )}

      {editingTaskId && <TaskEditor task={tasks.find(t => t.id === editingTaskId)} onClose={() => setEditingTaskId(null)} onUpdate={updateTaskDetails} onDelete={(id: string) => setTasks(prev => prev.filter(t => t.id !== id))} />}
      {editingRewardId && <RewardEditor reward={rewards.find(r => r.id === editingRewardId)} onClose={() => setEditingRewardId(null)} onUpdate={updateRewardDetails} onDelete={(id: string) => setRewards(prev => prev.filter(r => r.id !== id))} />}
      {editingHabitId && <HabitEditor habit={habits.find(h => h.id === editingHabitId)} onClose={() => setEditingHabitId(null)} onUpdate={updateHabitDetails} onDelete={(id: string) => setHabits(prev => prev.filter(h => h.id !== id))} />}
      {editingRoutineId && <RoutineEditor routine={recurringTasks.find(r => r.id === editingRoutineId)} onClose={() => setEditingRoutineId(null)} onUpdate={updateRoutineDetails} onDelete={(id: string) => setRecurringTasks(prev => prev.filter(r => r.id !== id))} />}
      {editingDopaId && <DopamenuEditor item={dopamenuItems.find(i => i.id === editingDopaId)} onClose={() => setEditingDopaId(null)} onUpdate={(id: string, updates: any) => setDopamenuItems(prev => prev.map(i => i.id === id ? {...i, ...updates} : i))} onDelete={(id: string) => setDopamenuItems(prev => prev.filter(i => i.id !== id))} />}
      {editingTimeboxId && <TimeboxEditor entry={timeboxEntries.find(e => e.id === editingTimeboxId)} onClose={() => setEditingTimeboxId(null)} onUpdate={(id: string, updates: any) => setTimeboxEntries(prev => prev.map(e => e.id === id ? {...e, ...updates} : e))} onDelete={(id: string) => setTimeboxEntries(prev => prev.filter(e => e.id !== id))} />}
      {showTimeboxCreator && <TimeboxCreator onClose={() => setShowTimeboxCreator(false)} onAdd={(entry: TimeboxEntry) => setTimeboxEntries([...timeboxEntries, entry])} />}
    </div>
  );
};

const StatBox = ({ label, value, icon, color, subValue }: any) => (
  <div className="p-6 md:p-8 theme-bg-card border-2 theme-border rounded-[40px] space-y-2 shadow-xl flex flex-col items-center text-center transition-all hover:border-orange-500/30 group">
     <div className={`p-3 rounded-2xl bg-slate-800/50 mb-2 group-hover:scale-110 transition-all ${color}`}>{icon}</div>
     <h4 className="text-[10px] font-black uppercase theme-text-muted tracking-widest">{label}</h4>
     <span className={`text-2xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</span>
     <p className="text-[8px] font-bold uppercase theme-text-muted opacity-60">{subValue}</p>
  </div>
);

const RewardEditor = ({ reward, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
       <div className="flex justify-between items-center"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-yellow-600 tracking-tighter">Configurar Mimo</h2><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">O que é a recompensa?</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-yellow-500 outline-none text-base" value={reward.name} onChange={e => onUpdate(reward.id, {name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Custo em XP</label><input type="number" className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border text-xl" value={reward.cost} onChange={e => onUpdate(reward.id, {cost: parseInt(e.target.value) || 0})} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Ícone</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={reward.icon} onChange={e => onUpdate(reward.id, {icon: e.target.value})}>{Object.keys(REWARD_ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição Neural</label><textarea rows={3} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-yellow-500 outline-none text-sm resize-none" value={reward.description} onChange={e => onUpdate(reward.id, {description: e.target.value})} placeholder="Por que você merece isso?" /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar Recompensa</button><button onClick={() => { if(confirm("Excluir recompensa?")) { onDelete(reward.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const TaskEditor = ({ task, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[56px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom">
       <div className="flex justify-between items-center"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Ajuste Neural</h2><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Tarefa</label><textarea rows={2} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-lg resize-none" value={task.text} onChange={e => onUpdate(task.id, {text: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Matriz</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={task.priority} onChange={e => onUpdate(task.id, {priority: e.target.value as Priority})}><option value={Priority.Q1}>Q1 - Crítico</option><option value={Priority.Q2}>Q2 - Estratégico</option><option value={Priority.Q3}>Q3 - Delegar</option><option value={Priority.Q4}>Q4 - Eliminar</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Energia</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={task.energy} onChange={e => onUpdate(task.id, {energy: e.target.value as any})}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option></select></div></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar</button><button onClick={() => { onDelete(task.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const HabitEditor = ({ habit, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500">
       <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Arquitetura de Hábito</h2></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Identidade</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={habit.identity} onChange={e => onUpdate(habit.id, {identity: e.target.value})} placeholder="Eu sou alguém que..." /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Hábito Central</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={habit.text} onChange={e => onUpdate(habit.id, {text: e.target.value})} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Gatilho (Âncora)</label><input className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={habit.anchor} onChange={e => onUpdate(habit.id, {anchor: e.target.value})} placeholder="Ao acordar..." /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Micro-Ação</label><input className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={habit.tinyAction} onChange={e => onUpdate(habit.id, {tinyAction: e.target.value})} placeholder="Fazer 1 flexão..." /></div></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar</button><button onClick={() => { if(confirm("Remover hábito?")) { onDelete(habit.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const RoutineEditor = ({ routine, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
       <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Neuro Ritual</h2></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Título da Rotina</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={routine.text} onChange={e => onUpdate(routine.id, {text: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Frequência Fixa</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={routine.frequency} onChange={e => onUpdate(routine.id, {frequency: e.target.value as Frequency})}>{Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}</select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Energia Necessária</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={routine.energy} onChange={e => onUpdate(routine.id, {energy: e.target.value as any})}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option></select></div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Gatilho Temporal/Visual</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={routine.anchor} onChange={e => onUpdate(routine.id, {anchor: e.target.value})} placeholder="Ex: Após fechar o notebook no trabalho..." /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição Organizacional</label><textarea rows={3} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-sm resize-none" value={routine.description} onChange={e => onUpdate(routine.id, {description: e.target.value})} placeholder="Instruções para evitar a fadiga de decisão..." /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar Ritual</button><button onClick={() => { if(confirm("Excluir rotina?")) { onDelete(routine.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const DopamenuEditor = ({ item, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
       <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-purple-600 tracking-tighter">Bio Refeição</h2></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Nome</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-purple-500 outline-none text-base" value={item.label} onChange={e => onUpdate(item.id, {label: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Categoria</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={item.category} onChange={e => onUpdate(item.id, {category: e.target.value as any})}><option value="Starter">Entrada</option><option value="Main">Prato Principal</option><option value="Side">Acompanhamento</option><option value="Dessert">Sobremesa</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Esforço</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={item.effort} onChange={e => onUpdate(item.id, {effort: e.target.value as any})}><option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option></select></div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição</label><textarea rows={3} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-purple-500 outline-none text-sm resize-none" value={item.description} onChange={e => onUpdate(item.id, {description: e.target.value})} /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-purple-600 text-white font-black uppercase rounded-[28px] shadow-glow-purple text-xs active:scale-95 transition-all">Salvar</button><button onClick={() => { if(confirm("Remover do menu?")) { onDelete(item.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const TimeboxCreator = ({ onClose, onAdd }: any) => {
  const [act, setAct] = useState(""); const [st, setSt] = useState("09:00"); const [et, setEt] = useState("10:00");
  return (
    <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[48px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom"><h2 className="text-2xl font-black uppercase italic theme-text-main tracking-tighter">Bloquear Tempo</h2><div className="space-y-5"><input autoFocus className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main text-lg border-2 theme-border focus:border-orange-500 outline-none" placeholder="O que será focado?" value={act} onChange={e => setAct(e.target.value)} /><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block tracking-widest">Início</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={st} onChange={e => setSt(e.target.value)} /></div><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block tracking-widest">Fim</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={et} onChange={e => setEt(e.target.value)} /></div></div></div><div className="flex flex-col gap-3"><button onClick={() => { onAdd({id: crypto.randomUUID(), activity: act, start: st, end: et, completed: false}); onClose(); }} className="w-full py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] text-xs active:scale-95 shadow-glow-orange">Selar Bloco</button><button onClick={onClose} className="w-full py-3 text-[10px] theme-text-muted uppercase font-black hover:theme-text-main transition-all">Cancelar</button></div></div>
    </div>
  );
};

const TimeboxEditor = ({ entry, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-lg theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[48px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom"><h2 className="text-2xl font-black uppercase italic theme-text-main tracking-tighter">Ajustar Bloco</h2><div className="space-y-5"><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main text-lg" value={entry.activity} onChange={e => onUpdate(entry.id, {activity: e.target.value})} /><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block">Início</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={entry.start} onChange={e => onUpdate(entry.id, {start: e.target.value})} /></div><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block">Fim</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={entry.end} onChange={e => onUpdate(entry.id, {end: e.target.value})} /></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] text-xs active:scale-95 transition-all">Confirmar</button><button onClick={() => { onDelete(entry.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div></div>
  </div>
);

const TaskCard = ({ task, onComplete, onEdit, compact = false }: any) => (
  <div className={`p-5 rounded-[32px] theme-bg-card border theme-border flex flex-col gap-3 transition-all active:scale-[0.97] md:hover:scale-[1.02] group relative ${task.completed ? 'opacity-50' : 'shadow-lg'}`}><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3 overflow-hidden flex-1"><button onClick={(e) => { e.stopPropagation(); onComplete(task.id); }} className={`w-7 h-7 md:w-8 md:h-8 rounded-xl border-2 theme-border flex items-center justify-center transition-all active:scale-75 ${task.completed ? 'bg-green-600 border-green-600 text-white shadow-glow-green' : 'hover:border-orange-500 bg-black/20'}`}>{task.completed && <Check size={16}/>}</button><div className="flex flex-col cursor-pointer flex-1" onClick={onEdit}><span className={`text-[12px] md:text-sm font-black uppercase theme-text-main truncate tracking-tighter ${task.completed ? 'line-through' : ''}`}>{task.text || "Nova Sinapse"}</span>{!compact && <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${task.energy === 'Baixa' ? 'text-green-500' : task.energy === 'Média' ? 'text-yellow-500' : 'text-red-500'}`}>{task.energy} Bateria</span>}</div></div>{!task.completed && ( <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>{task.isRefining ? <Loader2 size={16} className="animate-spin text-orange-500"/> : ( <button onClick={onEdit} className="p-2.5 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500 active:scale-90"><Edit3 size={16}/></button> )}</div> )}</div></div>
);

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange scale-[1.02]' : 'theme-text-muted hover:bg-white/5'}`}>{icon} {label}</button>
);

const MobIcon = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${active ? 'theme-text-main' : 'theme-text-muted'}`}><div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange scale-110 -translate-y-1' : 'theme-bg-input/20'}`}>{icon}</div><span className={`text-[8px] font-black uppercase mt-1 tracking-tighter ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span></button>
);

const SynapseLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" /><circle cx="16" cy="16" r="6" stroke="#f97316" strokeWidth="2.5"/><circle cx="16" cy="16" r="3" fill="#f97316"/><path d="M16 16L26 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="6" r="2.5" fill="#ef4444"/></svg>
);

export default App;
