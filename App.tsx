
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  CalendarDays, Trash2, Star, CheckCircle, Info, Move, MousePointer2,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope,
  Cloud, CloudOff, CloudSync, Mail, Rocket, BrainCog, StickyNote, ListChecks, Music, Activity, Star as StarIcon, Cpu,
  ChefHat, IceCream, Pizza, Cookie, ShieldAlert, ZapOff as ZapIcon, FastForward, Filter
} from 'lucide-react';
import { Priority, Task, Habit, IdentityBoost, PanicSolution, RecurringTask, Frequency, User, BrainCapacity, DopamenuItem } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  TIMER_START: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  TIMER_END: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  XP_GAIN: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

const SOUNDSCAPES = [
  { id: 'none', label: 'Silêncio', url: '' },
  { id: 'lofi', label: 'Lo-fi Neural', url: 'https://stream.zeno.fm/f3wvbb606ertv', level: 6 },
  { id: 'rain', label: 'Chuva Córtex', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', level: 6 }, 
  { id: 'white', label: 'Ruído Branco', url: '', level: 6 }
];

const LEVELS = [
  { level: 1, minPoints: 0, title: "Neurônio Inicial", unlock: "Início da Jornada" },
  { level: 2, minPoints: 1000, title: "Faísca Sináptica", unlock: "Tema: Oceano Profundo", themeId: 'theme-ocean' },
  { level: 3, minPoints: 3000, title: "Rede Conectada", unlock: "Tema: Floresta Córtex", themeId: 'theme-forest' },
  { level: 4, minPoints: 6000, title: "Mestre Executivo", unlock: "Tema: Pulso Cibernético", themeId: 'theme-cyber' },
  { level: 5, minPoints: 10000, title: "Arquiteto Cerebral", unlock: "Tema: Ouro Cerebral", themeId: 'theme-gold' },
  { level: 6, minPoints: 15000, title: "Maestro Neural", unlock: "Recurso: Soundscapes (Sons Ambientes)", feature: 'soundscapes' },
  { level: 7, minPoints: 22000, title: "Consciência Quântica", unlock: "Tema: Vácuo Quântico", themeId: 'theme-quantum' },
  { level: 8, minPoints: 32000, title: "Sábio Sináptico", unlock: "Tema: Mente Cósmica", themeId: 'theme-cosmic' },
  { level: 9, minPoints: 45000, title: "Entidade de Fluxo", unlock: "IA: Sugestões de Resgate Avançadas", feature: 'advanced-ai' },
  { level: 10, minPoints: 60000, title: "Transcendente", unlock: "Tema: Transcendência Final", themeId: 'theme-transcendent' },
];

const INITIAL_DOPAMENU: DopamenuItem[] = [
  { id: '1', category: 'Starter', label: 'Caminhada de 5 min', description: 'Ativação motora rápida para sair da inércia.' },
  { id: '2', category: 'Starter', label: 'Beber água gelada', description: 'Choque sensorial leve para o sistema nervoso.' },
  { id: '3', category: 'Main', label: 'Ler 15 min', description: 'Dopamina de baixo esforço e alto valor.' },
  { id: '4', category: 'Main', label: 'Meditação breve', description: 'Reset sináptico.' },
  { id: '5', category: 'Side', label: 'Playlist de Foco', description: 'Estímulo auditivo paralelo.' },
  { id: '6', category: 'Dessert', label: 'Assistir 1 Episódio', description: 'Recompensa final após grandes blocos.' },
];

interface DailyMission {
  id: number;
  text: string;
  minutes: number;
  completed: boolean;
}

const TUTORIAL_STEPS = [
  {
    title: "Seu Segundo Cérebro",
    theory: "O Córtex Pré-Frontal (CPF) é o CEO do seu cérebro, mas ele tem pouca memória ram. O estresse surge quando tentamos guardar tudo na cabeça.",
    description: "Este app não é apenas uma lista de tarefas, é uma prótese cognitiva. Vamos aprender a usá-lo passo a passo para liberar sua potência neural.",
    icon: <BrainCircuit className="w-16 h-16 text-orange-500" />,
    tab: null
  },
  {
    title: "1. Captura (Brain Dump)",
    theory: "O Efeito Zeigarnik diz que tarefas inacabadas 'rodam' em segundo plano, consumindo sua energia vital e gerando ansiedade.",
    description: "Use a aba 'CAPTURA' sempre que tiver uma ideia ou preocupação. Escreva tudo lá sem julgar. Isso remove o peso do seu cérebro imediatamente.",
    icon: <ListTodo className="w-16 h-16 text-blue-500" />,
    tab: 'capture'
  },
  {
    title: "2. Matriz de Eisenhower",
    theory: "Urgent nem sempre é importante. O cérebro tende a focar no que é barulhento, não no que é valioso.",
    description: "Na aba 'MATRIZ', arraste suas capturas. Foque no Q2 (Estratégico) para crescer, e resolva o Q1 (Crítico) para não colapsar.",
    icon: <LayoutGrid className="w-16 h-16 text-red-500" />,
    tab: 'plan'
  },
  {
    title: "3. Custo Energético",
    theory: "Tarefas exigem diferentes tipos de combustível neural. Tentar resolver algo 'Alta Energia' quando você está exausto gera frustração e procrastinação.",
    description: "Clique nos ícones de energia nas tarefas para definir o custo. O app ocultará o que for pesado demais para o seu estado atual (Arousal).",
    icon: <Zap className="w-16 h-16 text-yellow-500" />,
    tab: 'plan'
  },
  {
    title: "4. Regra das 3 Missões",
    theory: "O cérebro processa informações em blocos (chunking). Listas gigantes causam paralisia por análise.",
    description: "Na aba 'FOCAR', escolha apenas 3 missões para o dia. Se você fizer apenas essas 3, o seu dia já terá sido um sucesso neural.",
    icon: <Target className="w-16 h-16 text-orange-600" />,
    tab: 'execute'
  },
  {
    title: "5. Ciclos Ultradianos",
    theory: "O foco humano funciona em ondas de aproximadamente 90 minutos. Forçar além disso gera erro sináptico.",
    description: "Ao iniciar uma missão, ative o TIMER. Quando ele acabar, você DEVE parar. Respeite o limite químico do seu cérebro.",
    icon: <Timer className="w-16 h-16 text-green-500" />,
    tab: 'execute'
  },
  {
    title: "6. Automação (Hábitos)",
    theory: "Hábitos moram nos Gânglios Basais e não gastam energia do CPF. O segredo é o empilhamento: 'Depois de [Âncora], eu vou [Ação]'.",
    description: "Na aba 'HÁBITOS', use ações tão pequenas que o cérebro não consiga dizer não. Ex: 'Depois de escovar os dentes, vou ler 1 página'.",
    icon: <RefreshCw className="w-16 h-16 text-purple-500" />,
    tab: 'habits'
  },
  {
    title: "7. O Dopamenu",
    theory: "Se você não planeja seu descanso, seu cérebro vai roubá-lo de você através da distração (redes sociais, etc).",
    description: "Use o 'DOPAMENU' para escolher recompensas saudáveis após completar blocos de foco. Recarregue sua dopamina de forma estratégica.",
    icon: <UtensilsCrossed className="w-16 h-16 text-pink-500" />,
    tab: 'dopamenu'
  }
];

const CAPTURA_GUIDE_STEPS = [
  {
    title: "Captura Neural",
    theory: "Seu cérebro foi feito para ter ideias, não para guardá-las. Tentar lembrar de tudo consome 30% da energia do seu Córtex Pré-Frontal.",
    description: "A Captura é o seu 'External RAM'. Escreva aqui qualquer pensamento, meta ou preocupação, não importa o tamanho.",
    icon: <ListTodo size={48} className="text-blue-500" />
  },
  {
    title: "Efeito Zeigarnik",
    theory: "Tarefas em aberto geram 'loops cognitivos' que causam ansiedade constante até serem registradas em um sistema confiável.",
    description: "Ao escrever aqui, você fecha o loop. O cérebro relaxa porque sabe que a informação não será perdida.",
    icon: <Activity size={48} className="text-orange-500" />
  },
  {
    title: "Fluxo de Destino",
    theory: "A Captura é apenas o purgatório das ideias. Depois de descarregar, vá para a 'Matriz' para decidir o destino de cada meta.",
    description: "Não tente organizar enquanto captura. Apenas descarregue. A organização é um processo executivo diferente que deve ser feito depois.",
    icon: <FastForward size={48} className="text-green-500" />
  }
];

const FOCUS_GUIDE_STEPS = [
  {
    title: "Protocolo de Execução",
    theory: "Multitarefa é um mito. O cérebro gasta energia massiva no 'custo de troca' entre atividades.",
    description: "O modo Focar é o seu cockpit. Escolha UMA meta principal da sua lista e dedique sua atenção total a ela.",
    icon: <Target size={48} className="text-orange-600" />
  },
  {
    title: "A Regra das 3 Missões",
    theory: "Listas infinitas ativam o sistema de ameaça do cérebro, causando paralisia.",
    description: "Defina apenas 3 missões diárias no card superior. Se completar as 3, seu dia foi um sucesso neuroquímico.",
    icon: <StarIcon size={48} className="text-yellow-500" />
  },
  {
    title: "Ciclos Ultradianos",
    theory: "Nosso foco opera em ondas de ~90 minutos. Após esse tempo, a performance cai e a fadiga sináptica se instala.",
    description: "Use o Timer de 90 min. Quando ele tocar, você DEVE fazer um intervalo do seu 'Dopamenu'. É a lei da biologia.",
    icon: <Timer size={48} className="text-green-500" />
  }
];

const ROUTINES_GUIDE_STEPS = [
  {
    title: "Automação Executiva",
    theory: "Decisões triviais (o que comer, que horas treinar) esgotam seu estoque diário de força de vontade.",
    description: "As Rotinas Fixas transformam decisões em processos automáticos. O objetivo é economizar sua energia para o que realmente importa.",
    icon: <Repeat size={48} className="text-purple-500" />
  },
  {
    title: "Frequência e Ritmo",
    theory: "O cérebro ama previsibilidade. Ritmos circadianos estáveis melhoram o sono e a clareza mental.",
    description: "Use esta aba para tarefas que se repetem. Elas aparecerão automaticamente na sua fila de execução todos os dias ou semanas.",
    icon: <CalendarRange size={48} className="text-blue-400" />
  }
];

const HABITS_GUIDE_STEPS = [
  {
    title: "Neuroplasticidade Dirigida",
    theory: "Hábitos são caminhos neurais pavimentados nos Gânglios Basais. Uma vez formados, eles não exigem esforço consciente.",
    description: "Consolidar um hábito é como instalar um software no seu cérebro. Leva tempo, mas o retorno é eterno.",
    icon: <BrainCircuit size={48} className="text-orange-500" />
  },
  {
    title: "Empilhamento de Hábitos",
    theory: "É mais fácil construir uma nova sinapse em cima de uma já existente (uma Âncora).",
    description: "Use a fórmula: 'Depois de [Âncora], eu vou [Pequena Ação]'. Ex: 'Depois de fechar o notebook, eu vou meditar por 1 minuto'.",
    icon: <Anchor size={48} className="text-blue-500" />
  }
];

const DOPAMENU_GUIDE_STEPS = [
  {
    title: "O que é o Dopamenu?",
    theory: "Dopamina é o neurotransmissor da antecipação e recompensa. Se você não planeja seu lazer, o cérebro recorre ao lazer de 'baixo valor' (scrolling infinito).",
    description: "O Dopamenu ajuda você a curar uma lista de atividades que realmente recarregam sua bateria neural.",
    icon: <UtensilsCrossed className="w-16 h-16 text-orange-500" />
  },
  {
    title: "Starters (Entradas)",
    theory: "Atividades de 5-10 minutos com baixo custo de energia.",
    description: "Use para sair da inércia ou entre pequenas tarefas. Ex: Beber um café, alongar, ver 3 fotos de viagens.",
    icon: <Zap size={48} className="text-yellow-500" />
  },
  {
    title: "Mains (Pratos Principais)",
    theory: "20-40 minutos de descanso profundo.",
    description: "O verdadeiro combustível. Coisas que você ama e que exigem sua atenção total de forma prazerosa. Ex: Jogar um game, ler um livro, tocar um instrumento.",
    icon: <ChefHat size={48} className="text-blue-500" />
  }
];

const MATRIX_GUIDE_STEPS = [
  {
    title: "Matriz Neural",
    theory: "O cérebro tem dificuldade em distinguir o que é importante do que é apenas barulhento. A Matriz de Eisenhower automatiza esse filtro.",
    description: "Organizar suas metas em quadrantes libera o Córtex Pré-Frontal da carga cognitiva de decidir 'o que fazer agora' a cada 5 minutos.",
    icon: <LayoutGrid size={48} className="text-orange-500" />
  },
  {
    title: "Q1: O Quadrante de Crise",
    theory: "Importante e Urgente. Ativa a Amígdala e gera cortisol (estresse).",
    description: "Tarefas aqui precisam ser resolvidas AGORA para evitar o colapso. Se o seu Q1 está sempre cheio, você está em modo de sobrevivência, não de evolução.",
    icon: <ShieldAlert size={48} className="text-red-500" />
  },
  {
    title: "Q2: O Quadrante de Ouro",
    theory: "Importante, mas não Urgente. É onde a Neuroplasticidade e o Crescimento moram.",
    description: "Aqui estão seus projetos, estudos e saúde. O objetivo do NeuroExecutor é manter você a maior parte do dia neste quadrante. É o trabalho estratégico.",
    icon: <Target size={48} className="text-orange-600" />
  }
];

const SynapseLogo = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="logo-grad-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-primary, #f97316)" />
        <stop offset="100%" stopColor="var(--accent-secondary, #ef4444)" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" />
    <circle cx="16" cy="16" r="6" stroke="url(#logo-grad-fire)" strokeWidth="2" className="synapse-core" />
    <circle cx="16" cy="16" r="3" fill="url(#logo-grad-fire)" className="synapse-core" />
    <path d="M16 16L26 6" stroke="url(#logo-grad-fire)" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
    <circle cx="26" cy="6" r="2" fill="var(--accent-secondary, #ef4444)" />
  </svg>
);

const SparkleParticles: React.FC = () => {
  const particles = Array.from({ length: 24 });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2 + (Math.random() * 0.5);
        const velocity = 80 + Math.random() * 100;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        const size = 3 + Math.random() * 6;
        return (
          <div
            key={i}
            className="absolute rounded-full animate-particle shadow-lg"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: i % 2 === 0 ? '#f97316' : '#facc15',
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              animationDelay: `${Math.random() * 0.15}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            } as any}
          />
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neuro-dark-mode') !== 'false');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const playAudio = useCallback((soundUrl: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.debug("Audio play blocked"));
  }, [soundEnabled]);

  // States
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dopamenu' | 'dashboard'>('execute');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [points, setPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visualTheme, setVisualTheme] = useState(() => localStorage.getItem('neuro-visual-theme') || 'theme-default');
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>(INITIAL_DOPAMENU);
  const [sparkleTaskId, setSparkleTaskId] = useState<string | null>(null);
  const [activeSoundscape, setActiveSoundscape] = useState('none');
  const soundscapeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('neuro-user-email') || '');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [justCompletedMissionId, setJustCompletedMissionId] = useState<number | null>(null);
  const [justCompletedTaskId, setJustCompletedTaskId] = useState<string | null>(null);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([
    { id: 1, text: '', minutes: 30, completed: false },
    { id: 2, text: '', minutes: 30, completed: false },
    { id: 3, text: '', minutes: 30, completed: false }
  ]);
  const [currentArousal, setCurrentArousal] = useState<BrainCapacity>('Neutro');

  // Tutorial States
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [dopamenuGuideStep, setDopamenuGuideStep] = useState<number | null>(null);
  const [matrixGuideStep, setMatrixGuideStep] = useState<number | null>(null);
  const [captureGuideStep, setCaptureGuideStep] = useState<number | null>(null);
  const [focusGuideStep, setFocusGuideStep] = useState<number | null>(null);
  const [routinesGuideStep, setRoutinesGuideStep] = useState<number | null>(null);
  const [habitsGuideStep, setHabitsGuideStep] = useState<number | null>(null);

  // Sync theme with body class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('neuro-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Neural Levels Calculation
  const neuralProfile = useMemo(() => {
    const current = [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
    const next = LEVELS.find(l => points < l.minPoints);
    const progress = next 
      ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100 
      : 100;
    return { ...current, nextLevel: next, progress };
  }, [points]);

  // Cloud Sync Core Logic
  const handlePushToCloud = useCallback(async () => {
    if (!userEmail || userEmail === '') return;
    setIsSyncing(true);
    const data = { 
      tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme, isDarkMode, currentArousal
    };
    const success = await syncService.pushData(userEmail, data);
    if (success) setLastSynced(Date.now());
    setIsSyncing(false);
  }, [userEmail, tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme, isDarkMode, currentArousal]);

  const handlePullFromCloud = useCallback(async (email: string) => {
    if (!email) return;
    setIsSyncing(true);
    try {
      const cloudData = await syncService.pullData(email);
      if (cloudData) {
        setTasks(cloudData.tasks || []);
        setRecurringTasks(cloudData.recurringTasks || []);
        setHabits(cloudData.habits || []);
        setPoints(cloudData.points || 0);
        setDopamenuItems(cloudData.dopamenuItems || INITIAL_DOPAMENU);
        if (cloudData.visualTheme) setVisualTheme(cloudData.visualTheme);
        if (cloudData.isDarkMode !== undefined) setIsDarkMode(cloudData.isDarkMode);
        if (cloudData.dailyMissions) setDailyMissions(cloudData.dailyMissions);
        if (cloudData.currentArousal) setCurrentArousal(cloudData.currentArousal);
        setLastSynced(cloudData.updatedAt || Date.now());
      }
    } catch (e) { console.error("Failed to pull data", e); }
    setIsSyncing(false);
  }, []);

  // Initial Load
  useEffect(() => {
    const localData = localStorage.getItem('neuro_executor_data_v5');
    if (localData) {
      const parsed = JSON.parse(localData);
      setTasks(parsed.tasks || []);
      setRecurringTasks(parsed.recurringTasks || []);
      setHabits(parsed.habits || []);
      setPoints(parsed.points || 0);
      setDopamenuItems(parsed.dopamenuItems || INITIAL_DOPAMENU);
      if (parsed.dailyMissions) setDailyMissions(parsed.dailyMissions);
      if (parsed.currentArousal) setCurrentArousal(parsed.currentArousal);
    }
    setIsDataLoaded(true);
    if (userEmail) handlePullFromCloud(userEmail);
    if (!localStorage.getItem('neuro-tutorial-v4-seen')) setTutorialStep(0);
  }, []);

  // Always-On Synchronization (Debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    const dataToSave = { tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme, isDarkMode, currentArousal };
    localStorage.setItem('neuro_executor_data_v5', JSON.stringify(dataToSave));
    
    const syncTimeout = setTimeout(() => {
      handlePushToCloud();
    }, 1500); // 1.5s debounce for cloud sync

    return () => clearTimeout(syncTimeout);
  }, [tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, isDataLoaded, handlePushToCloud, visualTheme, isDarkMode, currentArousal]);

  // Timer Flow
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      playAudio(SOUNDS.TIMER_END);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, playAudio]);

  // Handlers
  const handleSetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;
    setUserEmail(emailInput);
    localStorage.setItem('neuro-user-email', emailInput);
    setShowSyncModal(false);
    await handlePullFromCloud(emailInput);
  };

  const addTask = (text: string, p: Priority = Priority.Q2) => {
    if (!text.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      text, priority: p, energy: 'Média', capacityNeeded: currentArousal,
      completed: false, subtasks: [], date: selectedDate, createdAt: Date.now()
    };
    setTasks(prev => [t, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          setPoints(p => p + 25);
          playAudio(SOUNDS.TASK_COMPLETE);
          setJustCompletedTaskId(id);
          setTimeout(() => setJustCompletedTaskId(null), 1000);
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const updateRecurringTaskEnergy = (id: string) => {
    setRecurringTasks(prev => prev.map(rt => {
      if (rt.id === id) {
        const nextEnergy: Task['energy'] = rt.energy === 'Baixa' ? 'Média' : rt.energy === 'Média' ? 'Alta' : 'Baixa';
        return { ...rt, energy: nextEnergy };
      }
      return rt;
    }));
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { 
          ...h, streak: h.streak + 1, lastCompleted: today, 
          completedDates: [...(h.completedDates || []), today] 
        };
      }
      return h;
    }));
  };

  const updateDailyMission = (id: number, updates: Partial<DailyMission>) => {
    setDailyMissions(prev => prev.map(m => {
      if (m.id === id) {
        if (updates.completed && !m.completed) {
          setPoints(p => p + 100);
          playAudio(SOUNDS.TASK_COMPLETE);
          setJustCompletedMissionId(id);
          setTimeout(() => setJustCompletedMissionId(null), 1000);
        }
        return { ...m, ...updates };
      }
      return m;
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const nextGuideStep = (currentStep: number | null, steps: any[], setter: (val: number | null) => void) => {
    if (currentStep === null) return;
    const next = currentStep + 1;
    if (next < steps.length) setter(next);
    else setter(null);
  };

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  }, []);

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);
  const executableList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const normalTasks = dayTasks.filter(t => !t.completed);
    const relevantRecurring = recurringTasks.filter(rt => !rt.completedDates.includes(today));
    const combined = [
      ...normalTasks,
      ...relevantRecurring.map(rt => ({ ...rt, completed: false, subtasks: [], date: today, createdAt: 0, capacityNeeded: 'Neutro' as BrainCapacity, isRecurring: true }))
    ];
    return combined.filter(t => {
      if (currentArousal === 'Exausto') return t.energy === 'Baixa';
      if (currentArousal === 'Neutro') return t.energy === 'Baixa' || t.energy === 'Média';
      return true;
    });
  }, [dayTasks, recurringTasks, currentArousal]);

  // Forms state
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitForm, setHabitForm] = useState({ text: '', anchor: '', tinyAction: '' });
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' as Task['energy'] });
  const [showDopamenuForm, setShowDopamenuForm] = useState(false);
  const [dopamenuForm, setDopamenuForm] = useState<Omit<DopamenuItem, 'id'>>({ category: 'Starter', label: '', description: '' });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-700 bg-[#020617] text-white ${visualTheme}`}>
      
      {/* Sidebar - Desktop */}
      <nav className={`hidden md:flex md:flex-col md:w-72 md:h-screen border-r border-slate-800 bg-[#0a1128]/95 z-50`}>
        <div className="flex flex-col p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase">Neuro</h1></div>
            <div className="flex gap-2">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nível Neural {neuralProfile.level}</p>
              <p className="text-[8px] font-black text-orange-500">{points} XP</p>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${neuralProfile.progress}%` }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidade Atual</p>
            <div className="flex gap-2">
              <ArousalButton active={currentArousal === 'Exausto'} onClick={() => setCurrentArousal('Exausto')} icon={<BatteryLow size={16}/>} label="Baixa" />
              <ArousalButton active={currentArousal === 'Neutro'} onClick={() => setCurrentArousal('Neutro')} icon={<BatteryMedium size={16}/>} label="Neutro" />
              <ArousalButton active={currentArousal === 'Hiperfocado'} onClick={() => setCurrentArousal('Hiperfocado')} icon={<BatteryFull size={16}/>} label="Pico" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <NavButton icon={<Timer />} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton icon={<TrendingUp />} label="Evolução" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<ListTodo />} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
          <NavButton icon={<UtensilsCrossed />} label="Dopamenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
          <NavButton icon={<LayoutGrid />} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<CalendarRange />} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')} />
          <NavButton icon={<RefreshCw />} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Binary />} label="Upgrades" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} />
        </div>

        <div className="mt-auto border-t border-slate-800/50 p-4">
          <button onClick={() => setShowSyncModal(true)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs transition-all ${userEmail ? 'text-green-500 bg-green-500/5' : 'text-slate-500 hover:bg-slate-800/30'}`}> 
            {isSyncing ? <CloudSync className="animate-spin" size={18}/> : userEmail ? <Cloud size={18} className={isSyncing ? "animate-pulse" : ""}/> : <CloudOff size={18}/>} 
            {userEmail ? 'NeuroSync Ativo' : 'Ativar NeuroSync'}
          </button>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex flex-col w-full bg-[#0a1128] border-b border-slate-800 z-50 sticky top-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2"><SynapseLogo className="w-6 h-6"/><h1 className="text-sm font-black italic text-orange-600 uppercase">Neuro</h1></div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-orange-500 uppercase">{points} XP</span>
              <div className="h-1 w-16 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-orange-600" style={{ width: `${neuralProfile.progress}%` }}></div>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400"><Moon size={18}/></button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-4">
          {['Exausto', 'Neutro', 'Hiperfocado'].map((c) => (
            <button 
              key={c}
              onClick={() => setCurrentArousal(c as BrainCapacity)} 
              className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${currentArousal === c ? 'bg-orange-600/10 border-orange-500 text-orange-500' : 'border-slate-800 text-slate-500'}`}
            >
              {c === 'Exausto' && <BatteryLow size={12}/>}
              {c === 'Neutro' && <BatteryMedium size={12}/>}
              {c === 'Hiperfocado' && <BatteryFull size={12}/>}
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-8 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-700">
               <h2 className="text-3xl font-black italic uppercase text-orange-600">Dashboard Neural</h2>
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 p-6 md:p-8 border rounded-[32px] md:rounded-[48px] bg-slate-900/60 border-slate-800 space-y-8">
                     <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Consistência Semanal</h3>
                     <div className="grid grid-cols-7 gap-2 md:gap-4 overflow-x-auto pb-4">
                        {last7Days.map((day) => {
                           const isToday = day === selectedDate;
                           const habitCount = habits.filter(h => h.completedDates?.includes(day)).length;
                           const routineCount = recurringTasks.filter(rt => rt.completedDates?.includes(day)).length;
                           return (
                              <div key={day} className={`flex flex-col items-center gap-4 min-w-[40px] p-2 md:p-4 rounded-2xl transition-all ${isToday ? 'bg-orange-600/5 ring-1 ring-orange-500/20' : ''}`}>
                                 <span className={`text-[8px] md:text-[10px] font-black uppercase ${isToday ? 'text-orange-500' : 'text-slate-600'}`}>
                                   {new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                 </span>
                                 <div className="flex flex-col gap-1 flex-1 justify-end min-h-[80px] md:min-h-[120px]">
                                    <div className="w-3 md:w-4 bg-orange-600 rounded-full" style={{ height: `${Math.max(4, habitCount * 15)}px` }}></div>
                                    <div className="w-3 md:w-4 bg-purple-600 rounded-full" style={{ height: `${Math.max(4, routineCount * 15)}px` }}></div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="p-8 border rounded-[32px] bg-orange-600/5 border-orange-500/10 flex flex-col items-center justify-center text-center gap-4">
                     <Trophy className="text-orange-500" size={32}/>
                     <p className="text-3xl font-black italic text-orange-600">{points} XP</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <h2 className="text-3xl font-black italic uppercase text-orange-600">Foco</h2>
                  <button onClick={() => setFocusGuideStep(0)} className="text-slate-500"><HelpCircle size={20}/></button>
                </div>

                <div className="p-8 text-center border rounded-[32px] md:rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <h2 className="text-6xl md:text-[100px] leading-none font-mono font-black tabular-nums mb-6">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-4 md:gap-6">
                    <button onClick={() => setIsTimerActive(!isTimerActive)} className="w-16 h-16 md:w-20 md:h-20 bg-orange-600 rounded-2xl md:rounded-[32px] flex items-center justify-center shadow-glow-orange active:scale-95 transition-all">{isTimerActive ? <Pause size={24}/> : <Play size={24} fill="currentColor"/>}</button>
                    <button onClick={() => setTimeLeft(90*60)} className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/80 rounded-2xl md:rounded-[32px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"><RotateCcw size={24}/></button>
                  </div>
                </div>

                <div className="p-6 md:p-10 border rounded-[32px] md:rounded-[48px] bg-slate-900/60 border-slate-800 shadow-lg space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] flex items-center gap-2"><Target size={12}/> Protocolo: 3 Missões</h3>
                  <div className="space-y-3">
                    {dailyMissions.map((mission) => (
                      <div key={mission.id} className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] border transition-all flex items-center gap-4 md:gap-6 ${mission.completed ? 'bg-green-600/5 border-green-500/20 opacity-60' : 'bg-slate-800/30 border-slate-700/30'}`}>
                        <button onClick={() => updateDailyMission(mission.id, { completed: !mission.completed })} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${mission.completed ? 'bg-green-600 text-white' : 'bg-slate-900 border border-slate-700'}`}>
                          <Check size={14} strokeWidth={3} className={mission.completed ? "animate-in zoom-in" : "text-transparent"} />
                        </button>
                        <input type="text" placeholder={`Missão #${mission.id}...`} className={`flex-1 bg-transparent border-none outline-none font-bold text-base md:text-lg ${mission.completed ? 'line-through text-slate-500' : ''}`} value={mission.text} onChange={(e) => updateDailyMission(mission.id, { text: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 md:p-8 border rounded-[32px] bg-slate-900/60 border-slate-800 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Próximas na Fila</h3>
                  <div className="space-y-2">
                    {executableList.map(t => (
                      <button key={t.id} onClick={() => setSelectedTask(t as any)} className={`w-full p-4 text-left border rounded-2xl transition-all ${selectedTask?.id === t.id ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 bg-slate-800/20'}`}>
                        <span className="text-xs font-bold truncate block">{t.text}</span>
                      </button>
                    ))}
                    {executableList.length === 0 && <p className="text-center py-8 text-[9px] text-slate-600 font-black uppercase">Vazio</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center gap-4 px-2">
                <h2 className="text-3xl font-black italic uppercase text-orange-600">Matriz</h2>
                <button onClick={() => setMatrixGuideStep(0)} className="text-slate-500"><HelpCircle size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => setEditingTask(t)} onUpdateEnergy={() => {}} currentArousal={currentArousal} onDrop={() => {}} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Estratégico" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => setEditingTask(t)} onUpdateEnergy={() => {}} currentArousal={currentArousal} onDrop={() => {}} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Delegar" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => setEditingTask(t)} onUpdateEnergy={() => {}} currentArousal={currentArousal} onDrop={() => {}} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => setEditingTask(t)} onUpdateEnergy={() => {}} currentArousal={currentArousal} onDrop={() => {}} />
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-12 md:py-24 space-y-12 text-center animate-in zoom-in">
              <div className="flex items-center justify-center gap-4">
                 <h2 className="text-4xl md:text-6xl font-black italic uppercase leading-tight">Captura</h2>
                 <button onClick={() => setCaptureGuideStep(0)} className="text-slate-600"><HelpCircle size={24}/></button>
              </div>
              <div className="p-6 md:p-10 bg-slate-900 border border-slate-800 rounded-[32px] md:rounded-[64px] flex items-center gap-4 focus-within:ring-2 focus-within:ring-orange-600 transition-all shadow-2xl">
                <input autoFocus className="flex-1 bg-transparent border-none text-xl md:text-3xl font-black outline-none placeholder:text-slate-800" placeholder="Esvazie a mente..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }}} />
                <button onClick={() => { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }} className="w-12 h-12 md:w-24 md:h-24 bg-orange-600 rounded-xl md:rounded-[40px] flex items-center justify-center shadow-glow-orange"><Plus size={24}/></button>
              </div>
            </div>
          )}

          {/* ... Outras abas (Fixed, Habits, Dopamenu, Upgrades) mantêm lógica similar, otimizadas com padding responsive ... */}
          {activeTab === 'habits' && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-3xl font-black italic uppercase text-orange-600">Hábitos</h2>
                <button onClick={() => setShowHabitForm(true)} className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-glow-orange"><Plus size={24}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.map(h => (
                  <div key={h.id} className={`p-6 rounded-[32px] border bg-slate-900/60 border-slate-800 transition-all flex flex-col justify-between min-h-[300px]`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <Flame className={h.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-800"} size={24} />
                        <span className="text-3xl font-black italic leading-none">{h.streak}</span>
                      </div>
                      <input className="w-full bg-transparent border-none text-lg font-black uppercase outline-none" value={h.text} onChange={(e) => updateHabit(h.id, { text: e.target.value })} />
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Então: {h.tinyAction}</p>
                    </div>
                    <button onClick={() => completeHabit(h.id)} disabled={h.lastCompleted === selectedDate} className={`mt-6 py-4 rounded-xl font-black text-xs transition-all ${h.lastCompleted === selectedDate ? 'bg-green-600/20 text-green-500' : 'bg-orange-600 text-white shadow-glow-orange'}`}>
                      {h.lastCompleted === selectedDate ? 'Consolidado' : 'Consolidar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Fixed Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a1128]/95 backdrop-blur-xl border-t border-slate-800 z-50 overflow-x-auto flex px-4 py-2 gap-4 no-scrollbar">
        <MobileNavButton icon={<Timer />} active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
        <MobileNavButton icon={<ListTodo />} active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
        <MobileNavButton icon={<LayoutGrid />} active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
        <MobileNavButton icon={<UtensilsCrossed />} active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
        <MobileNavButton icon={<CalendarRange />} active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')} />
        <MobileNavButton icon={<RefreshCw />} active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
        <MobileNavButton icon={<TrendingUp />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavButton icon={<Binary />} active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} />
      </nav>

      {/* Guide Overlays (Reusable) */}
      <GuideOverlay step={captureGuideStep} steps={CAPTURA_GUIDE_STEPS} onNext={() => nextGuideStep(captureGuideStep, CAPTURA_GUIDE_STEPS, setCaptureGuideStep)} onClose={() => setCaptureGuideStep(null)} />
      <GuideOverlay step={focusGuideStep} steps={FOCUS_GUIDE_STEPS} onNext={() => nextGuideStep(focusGuideStep, FOCUS_GUIDE_STEPS, setFocusGuideStep)} onClose={() => setFocusGuideStep(null)} />
      <GuideOverlay step={matrixGuideStep} steps={MATRIX_GUIDE_STEPS} onNext={() => nextGuideStep(matrixGuideStep, MATRIX_GUIDE_STEPS, setMatrixGuideStep)} onClose={() => setMatrixGuideStep(null)} />

      {/* Global Tutorial */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0a1128] border border-orange-500/20 rounded-[40px] p-8 md:p-16 text-center space-y-8 shadow-3xl">
             <div className="relative p-6 bg-slate-900/50 rounded-full border border-orange-500/20 inline-block">
               {TUTORIAL_STEPS[tutorialStep].icon}
             </div>
             <div className="space-y-4">
                <h2 className="text-2xl md:text-4xl font-black uppercase italic text-orange-500 tracking-tighter">{TUTORIAL_STEPS[tutorialStep].title}</h2>
                <div className="bg-slate-900/80 p-6 rounded-[24px] border border-slate-800/50 text-left">
                  <p className="text-sm text-slate-300 italic">"{TUTORIAL_STEPS[tutorialStep].theory}"</p>
                </div>
                <p className="text-sm md:text-base text-slate-200 font-medium">{TUTORIAL_STEPS[tutorialStep].description}</p>
             </div>
             <button onClick={() => { if(tutorialStep === TUTORIAL_STEPS.length-1) setTutorialStep(null); else setTutorialStep(tutorialStep+1); }} className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-glow-orange flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
               {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Começar" : "Próximo"} <ArrowRight size={20}/>
             </button>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0a1128] border border-blue-500/20 rounded-[40px] p-8 md:p-12 space-y-8 shadow-3xl">
             <div className="flex justify-center"><CloudSync size={48} className="text-blue-500"/></div>
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-500">Ativar NeuroSync</h2>
                <p className="text-slate-400 text-xs md:text-sm">Insira seu e-mail para sincronizar todos os seus neurônios digitais entre dispositivos.</p>
             </div>
             <form onSubmit={handleSetEmail} className="space-y-4">
                <input type="email" placeholder="seu@email.com" required className="w-full py-4 px-6 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-glow-blue">Sincronizar Agora</button>
             </form>
             <button onClick={() => setShowSyncModal(false)} className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest">Fechar</button>
          </div>
        </div>
      )}

      {/* Habit Form */}
      {showHabitForm && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={(e) => { e.preventDefault(); if(!habitForm.text) return; const h: Habit = { id: crypto.randomUUID(), ...habitForm, streak: 0, lastCompleted: null, completedDates: [] }; setHabits(prev => [h, ...prev]); setHabitForm({ text: '', anchor: '', tinyAction: '' }); setShowHabitForm(false); }} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[40px] p-8 md:p-12 space-y-8">
            <h2 className="text-xl font-black text-orange-600 uppercase">Novo Hábito</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors text-sm" placeholder="O Hábito" value={habitForm.text} onChange={e => setHabitForm({...habitForm, text: e.target.value})} />
              <input className="w-full py-4 px-6 rounded-xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors text-sm" placeholder="Eu vou..." value={habitForm.tinyAction} onChange={e => setHabitForm({...habitForm, tinyAction: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-4 bg-orange-600 rounded-[20px] font-black uppercase text-xs shadow-glow-orange">Ativar</button>
            <button type="button" onClick={() => setShowHabitForm(false)} className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest">Voltar</button>
          </form>
        </div>
      )}
    </div>
  );
};

const MobileNavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex-shrink-0 p-4 rounded-2xl transition-all ${active ? 'bg-orange-600 text-white shadow-lg scale-110' : 'text-slate-500'}`}>
    {icon}
  </button>
);

const ArousalButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${active ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-glow-orange animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
    {icon}<span className="text-[8px] font-black uppercase">{label}</span>
  </button>
);

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all md:flex-row md:justify-start md:gap-5 md:w-full md:px-8 md:py-5 min-w-[80px] ${active ? 'bg-orange-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800/30'}`}>
    {icon}<span className="text-[10px] mt-2 font-black uppercase md:text-sm md:mt-0 md:tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void, onUpdateEnergy: (id: string) => void, currentArousal: BrainCapacity }> = ({ priority, title, color, tasks, onSelect, onDrop, onUpdateEnergy, currentArousal }) => {
  return (
    <div className={`p-6 md:p-10 border rounded-[32px] md:rounded-[56px] ${color} min-h-[300px] transition-all group shadow-sm`}>
      <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 mb-6">{title}</h3>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} onClick={() => onSelect(t)} className={`p-4 md:p-6 bg-slate-900 border border-orange-500/20 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-orange-500/60 transition-all`}>
            <span className="text-xs md:text-sm font-black truncate flex-1">{t.text}</span>
            <span className="px-2 py-1 rounded-full text-[7px] font-black uppercase bg-slate-800 text-slate-400">{t.energy}</span>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center py-12 text-[8px] font-black text-slate-700 uppercase opacity-30">Vazio</p>}
      </div>
    </div>
  );
};

const GuideOverlay: React.FC<{ step: number | null, steps: any[], onNext: () => void, onClose: () => void }> = ({ step, steps, onNext, onClose }) => {
  if (step === null) return null;
  const current = steps[step];
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in">
       <div className="w-full max-w-xl bg-[#0a1128] border border-orange-500/20 rounded-[40px] p-8 text-center space-y-6 shadow-3xl">
          <div className="flex justify-center mb-2">{current.icon}</div>
          <div className="space-y-4">
             <h2 className="text-2xl font-black uppercase italic text-orange-500 tracking-tighter">{current.title}</h2>
             <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 text-left">
                <p className="text-xs text-slate-300 italic leading-relaxed">"{current.theory}"</p>
             </div>
             <p className="text-sm text-slate-200 leading-relaxed">{current.description}</p>
          </div>
          <div className="flex flex-col gap-2">
             <button onClick={onNext} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
               {step === steps.length - 1 ? "Entendido" : "Próximo"}
             </button>
             <button onClick={onClose} className="text-slate-600 uppercase text-[9px] font-black tracking-widest py-2">Pular</button>
          </div>
       </div>
    </div>
  );
};

export default App;
