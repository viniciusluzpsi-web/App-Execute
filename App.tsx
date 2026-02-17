
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
  },
  {
    title: "Tudo Pronto!",
    theory: "A neuroplasticidade leva tempo. Seja gentil com seu cérebro.",
    description: "Agora, insira seu e-mail no rodapé da barra lateral (NeuroSync) para nunca perder seu progresso. Boa jornada, NeuroExecutor.",
    icon: <Rocket className="w-16 h-16 text-orange-500" />,
    tab: null
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
  },
  {
    title: "Chunking (Decomposição)",
    theory: "Tarefas grandes demais parecem ameaças físicas para o cérebro. O medo de falhar gera procrastinação.",
    description: "Se estiver travado, use o botão de IA para quebrar a tarefa em micro-passos 'ridiculamente fáceis'. O segredo é o movimento, não a velocidade.",
    icon: <Wand2 size={48} className="text-purple-500" />
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
  },
  {
    title: "O Poder do 'Muito Pequeno'",
    theory: "A maior barreira para um novo hábito é o início. Se a ação for pequena demais para falhar, a resistência neural some.",
    description: "Não tente correr 10km. Comece vestindo os tênis. Ganhe o jogo da consistência antes de aumentar a intensidade.",
    icon: <Flame size={48} className="text-orange-600" />
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
  },
  {
    title: "Sides (Acompanhamentos)",
    theory: "Estímulos passivos que acompanham o trabalho.",
    description: "Cria um ambiente de trabalho mais estimulante. Ex: Playlists Lo-Fi, velas aromáticas, trabalhar em um café.",
    icon: <Waves size={48} className="text-purple-500" />
  },
  {
    title: "Desserts (Sobremesas)",
    theory: "Grandes recompensas de final de dia.",
    description: "Atividades de alto estímulo que devem ser feitas apenas APÓS o trabalho pesado. Ex: Ver um filme, maratonar série, jantar fora.",
    icon: <IceCream size={48} className="text-pink-500" />
  },
  {
    title: "Personalize sua Dieta",
    theory: "Sua biologia é única. O que dá dopamina para um, pode ser estresse para outro.",
    description: "Use os botões '+' e 'Lixeira' para remover o que não ressoa com você e adicionar o que realmente te faz feliz.",
    icon: <Palette size={48} className="text-green-500" />
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
  },
  {
    title: "Q3: As Interrupções",
    theory: "Urgente, mas não Importante. Frequentemente são as prioridades de outras pessoas.",
    description: "Notificações, e-mails reativos e pedidos triviais. Tente delegar ou agrupar essas tarefas para não fragmentar seu foco.",
    icon: <ZapIcon size={48} className="text-blue-500" />
  },
  {
    title: "Q4: O Lixo Dopaminérgico",
    theory: "Nem Urgente, nem Importante. Frequentemente usado como mecanismo de fuga da ansiedade.",
    description: "Distrações vazias. Se você está aqui muito tempo, seu cérebro está tentando se proteger de uma sobrecarga emocional em outros quadrantes.",
    icon: <Trash2 size={48} className="text-slate-500" />
  },
  {
    title: "Fluxo de Trabalho",
    theory: "Arraste e solte tarefas da sua Captura para os quadrantes.",
    description: "Use o ícone de 'Energia' para alinhar a tarefa com sua bateria atual. Se estiver exausto, foque no que é 'Baixa Energia', independente do quadrante.",
    icon: <Filter size={48} className="text-green-500" />
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

  // Sync theme with body class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('neuro-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

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
  
  // Sync States
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('neuro-user-email') || '');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Feedback states for animations
  const [justCompletedMissionId, setJustCompletedMissionId] = useState<number | null>(null);
  const [justCompletedTaskId, setJustCompletedTaskId] = useState<string | null>(null);

  // Daily Missions State
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([
    { id: 1, text: '', minutes: 30, completed: false },
    { id: 2, text: '', minutes: 30, completed: false },
    { id: 3, text: '', minutes: 30, completed: false }
  ]);

  // Tutorial States
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [dopamenuGuideStep, setDopamenuGuideStep] = useState<number | null>(null);
  const [matrixGuideStep, setMatrixGuideStep] = useState<number | null>(null);
  const [captureGuideStep, setCaptureGuideStep] = useState<number | null>(null);
  const [focusGuideStep, setFocusGuideStep] = useState<number | null>(null);
  const [routinesGuideStep, setRoutinesGuideStep] = useState<number | null>(null);
  const [habitsGuideStep, setHabitsGuideStep] = useState<number | null>(null);

  // Neural Levels Calculation
  const neuralProfile = useMemo(() => {
    const current = [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
    const next = LEVELS.find(l => points < l.minPoints);
    const progress = next 
      ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100 
      : 100;
    return { ...current, nextLevel: next, progress };
  }, [points]);

  // Persistence & Sync Logic
  const handlePushToCloud = useCallback(async () => {
    if (!userEmail || userEmail === '') return;
    setIsSyncing(true);
    const data = { tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme };
    const success = await syncService.pushData(userEmail, data);
    if (success) {
      setLastSynced(Date.now());
    }
    setIsSyncing(false);
  }, [userEmail, tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme]);

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
        if (cloudData.dailyMissions) setDailyMissions(cloudData.dailyMissions);
        setLastSynced(cloudData.updatedAt || Date.now());
      }
    } catch (e) {
      console.error("Failed to pull data", e);
    }
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const localData = localStorage.getItem('neuro_executor_data_v4');
    if (localData) {
      const parsed = JSON.parse(localData);
      setTasks(parsed.tasks || []);
      setRecurringTasks(parsed.recurringTasks || []);
      setHabits(parsed.habits || []);
      setPoints(parsed.points || 0);
      setDopamenuItems(parsed.dopamenuItems || INITIAL_DOPAMENU);
      if (parsed.dailyMissions) setDailyMissions(parsed.dailyMissions);
    }
    setIsDataLoaded(true);

    if (userEmail) {
      handlePullFromCloud(userEmail);
    }

    if (!localStorage.getItem('neuro-tutorial-v4-seen')) {
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const dataToSave = { tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, visualTheme };
    localStorage.setItem('neuro_executor_data_v4', JSON.stringify(dataToSave));
    
    const timeout = setTimeout(() => {
      handlePushToCloud();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, isDataLoaded, handlePushToCloud, visualTheme]);

  // Soundscape Player
  useEffect(() => {
    if (soundscapeAudioRef.current) {
      soundscapeAudioRef.current.pause();
      soundscapeAudioRef.current = null;
    }

    const scape = SOUNDSCAPES.find(s => s.id === activeSoundscape);
    if (scape && scape.url) {
      const audio = new Audio(scape.url);
      audio.loop = true;
      audio.volume = 0.2;
      audio.play().catch(e => console.debug("Audio play blocked"));
      soundscapeAudioRef.current = audio;
    }
  }, [activeSoundscape]);

  // UI Flow States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [currentArousal, setCurrentArousal] = useState<BrainCapacity>('Neutro');

  // Timer countdown
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

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitForm.text) return;
    const h: Habit = { id: crypto.randomUUID(), ...habitForm, streak: 0, lastCompleted: null, completedDates: [] };
    setHabits(prev => [h, ...prev]);
    setHabitForm({ text: '', anchor: '', tinyAction: '' });
    setShowHabitForm(false);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const addRecurringTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.text) return;
    const rt: RecurringTask = { id: crypto.randomUUID(), ...recurringForm, priority: Priority.Q2, completedDates: [] };
    setRecurringTasks(prev => [rt, ...prev]);
    setRecurringForm({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' });
    setShowRecurringForm(false);
  };

  const updateRecurringTask = (id: string, updates: Partial<RecurringTask>) => {
    setRecurringTasks(prev => prev.map(rt => rt.id === id ? { ...rt, ...updates } : rt));
  };

  const addDopamenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dopamenuForm.label) return;
    const item: DopamenuItem = { id: crypto.randomUUID(), ...dopamenuForm };
    setDopamenuItems(prev => [...prev, item]);
    setDopamenuForm({ category: 'Starter', label: '', description: '' });
    setShowDopamenuForm(false);
  };

  const removeDopamenuItem = (id: string) => {
    setDopamenuItems(prev => prev.filter(item => item.id !== id));
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

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateTaskEnergy = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextEnergy: Task['energy'] = t.energy === 'Baixa' ? 'Média' : t.energy === 'Média' ? 'Alta' : 'Baixa';
        return { ...t, energy: nextEnergy };
      }
      return t;
    }));
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

  const toggleRecurringTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    let justCompleted = false;
    setRecurringTasks(prev => prev.map(rt => {
      if (rt.id === id) {
        const isDoneToday = rt.completedDates.includes(today);
        if (!isDoneToday) {
          setPoints(p => p + 15);
          playAudio(SOUNDS.TASK_COMPLETE);
          justCompleted = true;
          return { ...rt, completedDates: [...rt.completedDates, today] };
        } else {
          return { ...rt, completedDates: rt.completedDates.filter(d => d !== today) };
        }
      }
      return rt;
    }));
    if (justCompleted) {
      setSparkleTaskId(id);
      setTimeout(() => setSparkleTaskId(null), 1000);
    }
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { 
          ...h, 
          streak: h.streak + 1, 
          lastCompleted: today, 
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

  const handleTaskDrop = (taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDecompose = async (task: Task) => {
    if (isDecomposing) return;
    setIsDecomposing(true);
    try {
      const steps = await geminiService.decomposeTask(task.text);
      if (steps && steps.length > 0) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: steps } : t));
        setEditingTask(prev => prev?.id === task.id ? { ...prev, subtasks: steps } : prev);
      }
    } catch (error) { console.error(error); } finally { setIsDecomposing(false); }
  };

  const handleAutoCategorize = async () => {
    if (isOptimizing || tasks.length === 0) return;
    setIsOptimizing(true);
    try {
      const updates = await geminiService.categorizeTasks(tasks.filter(t => !t.completed));
      if (updates && updates.length > 0) {
        setTasks(prev => prev.map(t => {
          const update = updates.find(u => u.id === t.id);
          return update ? { ...t, priority: update.priority, energy: update.energy } : t;
        }));
      }
    } catch (error) { console.error(error); } finally { setIsOptimizing(false); }
  };

  const handleThemeChange = (themeId: string) => {
    setVisualTheme(themeId);
    localStorage.setItem('neuro-visual-theme', themeId);
  };

  const nextTutorialStep = () => {
    if (tutorialStep === null) return;
    const nextStep = tutorialStep + 1;
    if (nextStep < TUTORIAL_STEPS.length) {
      const stepData = TUTORIAL_STEPS[nextStep];
      if (stepData.tab) setActiveTab(stepData.tab as any);
      setTutorialStep(nextStep);
    } else {
      setTutorialStep(null);
      localStorage.setItem('neuro-tutorial-v4-seen', 'true');
    }
  };

  const skipTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('neuro-tutorial-v4-seen', 'true');
  };

  const nextGuideStep = (currentStep: number | null, steps: any[], setter: (val: number | null) => void) => {
    if (currentStep === null) return;
    const next = currentStep + 1;
    if (next < steps.length) {
      setter(next);
    } else {
      setter(null);
    }
  };

  // Metrics Logic
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
      {/* Sidebar */}
      <nav className={`fixed bottom-0 w-full backdrop-blur-xl border-t md:static md:w-72 md:h-screen md:border-r z-50 flex md:flex-col bg-[#0a1128]/95 border-slate-800`}>
        <div className="hidden md:flex flex-col p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase">Neuro</h1></div>
            <div className="flex gap-2">
              <button onClick={() => setSoundEnabled(!soundEnabled)} title="Alternar Som" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} title="Alternar Tema" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
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
            <p className="text-[8px] font-bold text-slate-600 uppercase text-right">{neuralProfile.title}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidade Atual</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentArousal('Exausto')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Exausto' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-glow-blue animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryLow size={16}/><span className="text-[8px] font-black uppercase">Exausto</span>
              </button>
              <button onClick={() => setCurrentArousal('Neutro')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Neutro' ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-glow-orange animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryMedium size={16}/><span className="text-[8px] font-black uppercase">Neutro</span>
              </button>
              <button onClick={() => setCurrentArousal('Hiperfocado')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Hiperfocado' ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-glow-purple animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryFull size={16}/><span className="text-[8px] font-black uppercase">Pico</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-around p-2 md:flex-col md:gap-2 md:px-4 md:justify-start overflow-x-auto md:overflow-x-visible">
          <NavButton icon={<Timer />} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton icon={<TrendingUp />} label="Evolução" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<ListTodo />} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
          <NavButton icon={<UtensilsCrossed />} label="Dopamenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
          <NavButton icon={<LayoutGrid />} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<CalendarRange />} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')} />
          <NavButton icon={<RefreshCw />} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Binary />} label="Upgrades" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} />
        </div>

        <div className="hidden md:flex flex-col gap-1 p-4 mt-auto border-t border-slate-800/50">
          <button 
            onClick={() => setShowSyncModal(true)} 
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs transition-all ${userEmail ? 'text-green-500 bg-green-500/5' : 'text-slate-500 hover:bg-slate-800/30'}`}
          > 
            {isSyncing ? <CloudSync className="animate-spin" size={18}/> : userEmail ? <Cloud size={18}/> : <CloudOff size={18}/>} 
            {userEmail ? 'Cérebro Sincronizado' : 'Ativar NeuroSync'}
          </button>
          <button onClick={() => setTutorialStep(0)} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-800/30 transition-colors"> <BookOpen size={18}/> Tutorial </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="flex flex-col gap-2 px-4">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-orange-600">Dashboard Neural</h2>
                  <p className="text-xs text-slate-500 font-medium">Visualização da sua arquitetura de produtividade nos últimos 7 dias.</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 p-8 border rounded-[48px] bg-slate-900/60 border-slate-800 space-y-8">
                     <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Fluxo de Consistência Semanal</h3>
                     </div>
                     <div className="grid grid-cols-7 gap-4">
                        {last7Days.map((day) => {
                           const dayName = new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                           const habitCount = habits.filter(h => h.completedDates?.includes(day)).length;
                           const routineCount = recurringTasks.filter(rt => rt.completedDates?.includes(day)).length;
                           const isToday = day === selectedDate;
                           return (
                              <div key={day} className={`flex flex-col items-center gap-4 p-4 rounded-3xl transition-all ${isToday ? 'bg-orange-600/5 ring-1 ring-orange-500/20' : ''}`}>
                                 <span className={`text-[10px] font-black uppercase ${isToday ? 'text-orange-500' : 'text-slate-600'}`}>{dayName}</span>
                                 <div className="flex flex-col gap-2 flex-1 justify-end min-h-[120px]">
                                    <div className="w-4 bg-orange-600 rounded-full" style={{ height: `${Math.max(4, habitCount * 20)}px` }}></div>
                                    <div className="w-4 bg-purple-600 rounded-full" style={{ height: `${Math.max(4, routineCount * 20)}px` }}></div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="p-8 border rounded-[40px] bg-orange-600/5 border-orange-500/10 flex flex-col items-center justify-center text-center gap-4">
                     <Trophy className="text-orange-500" size={40}/>
                     <div><p className="text-4xl font-black italic text-orange-600">{points}</p></div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-black italic uppercase text-orange-600">Protocolo de Foco</h2>
                    <button onClick={() => setFocusGuideStep(0)} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <HelpCircle size={24}/>
                    </button>
                  </div>
                </div>

                {/* Timer */}
                <div className="p-12 text-center border rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <h2 className="text-[100px] leading-none font-mono font-black tabular-nums mb-8">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-6">
                    <button onClick={() => setIsTimerActive(!isTimerActive)} className="w-20 h-20 bg-orange-600 rounded-[32px] flex items-center justify-center shadow-glow-orange active:scale-95 transition-all">{isTimerActive ? <Pause size={32}/> : <Play size={32} fill="currentColor"/>}</button>
                    <button onClick={() => setTimeLeft(90*60)} className="w-20 h-20 bg-slate-800/80 rounded-[32px] flex items-center justify-center hover:text-white transition-colors"><RotateCcw size={32}/></button>
                  </div>
                  
                  {points >= 15000 && (
                    <div className="mt-8 pt-8 border-t border-slate-800 flex flex-wrap justify-center gap-4">
                      {SOUNDSCAPES.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setActiveSoundscape(s.id)}
                          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${activeSoundscape === s.id ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                        >
                          <Music size={12} className="inline mr-2"/> {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Protocolo de 3 Missões Card */}
                <div className="p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 shadow-xl space-y-6">
                  <h3 className="text-[11px] font-black uppercase text-orange-500 tracking-[0.3em] flex items-center gap-2">
                    <Target size={14} /> Protocolo: 3 Missões Diárias
                  </h3>
                  <div className="space-y-4">
                    {dailyMissions.map((mission) => {
                      const isJustCompleted = justCompletedMissionId === mission.id;
                      return (
                        <div key={mission.id} className={`p-6 rounded-[32px] border transition-all duration-500 flex items-center gap-6 relative overflow-hidden ${mission.completed ? 'bg-green-600/5 border-green-500/20 opacity-60' : 'bg-slate-800/30 border-slate-700/30'} ${isJustCompleted ? 'animate-glow-success border-green-500' : ''}`}>
                          <button 
                            onClick={() => updateDailyMission(mission.id, { completed: !mission.completed })} 
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${mission.completed ? 'bg-green-600 text-white' : 'bg-slate-900 border border-slate-700'} ${isJustCompleted ? 'animate-bounce' : ''}`}
                          >
                            <Check size={20} strokeWidth={3} className={mission.completed ? "animate-in zoom-in duration-300" : "text-transparent"} />
                          </button>
                          <input type="text" placeholder={`Missão #${mission.id}...`} className={`flex-1 bg-transparent border-none outline-none font-bold text-lg transition-all ${mission.completed ? 'line-through text-slate-500' : ''}`} value={mission.text} onChange={(e) => updateDailyMission(mission.id, { text: e.target.value })} />
                          <div className="flex gap-1">
                            {[15, 30, 45, 60].map(m => (
                              <button key={m} onClick={() => { setTimeLeft(m * 60); updateDailyMission(mission.id, { minutes: m }); }} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${mission.minutes === m ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>{m}m</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fila Lateral */}
              <div className="space-y-6">
                <div className="p-8 border rounded-[40px] bg-slate-900/60 border-slate-800 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Fila de Execução</h3>
                  <div className="space-y-3">
                    {executableList.map(t => (
                      <button key={t.id} onClick={() => setSelectedTask(t as any)} className={`w-full p-5 text-left border rounded-[24px] transition-all group ${selectedTask?.id === t.id ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/30 hover:border-slate-700'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold truncate block transition-transform group-hover:translate-x-1">{t.text}</span>
                          <ChevronRight size={14} className={`transition-opacity ${selectedTask?.id === t.id ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                      </button>
                    ))}
                    {executableList.length === 0 && <p className="text-center py-10 text-[10px] text-slate-600 font-black uppercase opacity-40">Nenhuma tarefa pendente</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center px-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-black italic uppercase text-orange-600">Matriz Neural</h2>
                    <button onClick={() => setMatrixGuideStep(0)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Como funciona a Matriz?">
                        <HelpCircle size={24}/>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Distribua suas metas para reduzir a paralisia de decisão.</p>
                </div>
                <div className="flex gap-4">
                  {points >= 45000 && (
                     <button onClick={handleAutoCategorize} disabled={isOptimizing} className="flex items-center gap-3 px-6 py-4 bg-orange-600 text-white rounded-3xl font-black uppercase text-[10px] shadow-glow-orange hover:scale-105 active:scale-95 transition-all">
                       {isOptimizing ? <Loader2 size={16} className="animate-spin"/> : <Cpu size={16}/>} Auto-Organizar via IA
                     </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico e Urgente" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => setEditingTask(t)} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Importante/Estratégico" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => setEditingTask(t)} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Interrupções/Delegar" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => setEditingTask(t)} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar Distrações" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => setEditingTask(t)} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-24 space-y-16 text-center animate-in zoom-in duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                   <h2 className="text-6xl font-black italic uppercase leading-tight">Captura<br/>Mente</h2>
                   <button onClick={() => setCaptureGuideStep(0)} className="p-2 text-slate-800 hover:text-slate-600 transition-colors">
                      <HelpCircle size={32}/>
                   </button>
                </div>
              </div>
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[64px] flex items-center gap-6 focus-within:ring-2 focus-within:ring-orange-600 transition-all shadow-2xl">
                <input autoFocus className="flex-1 bg-transparent border-none text-3xl font-black outline-none placeholder:text-slate-800" placeholder="O que está na cabeça?" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }}} />
                <button onClick={() => { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }} className="w-24 h-24 bg-orange-600 rounded-[40px] flex items-center justify-center shadow-glow-orange active:scale-95 transition-all"><Plus size={48}/></button>
              </div>
            </div>
          )}

          {activeTab === 'fixed' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                   <h2 className="text-4xl font-black italic uppercase text-purple-400">Rotinas Fixas</h2>
                   <button onClick={() => setRoutinesGuideStep(0)} className="p-2 text-slate-500 hover:text-white transition-colors">
                      <HelpCircle size={24}/>
                   </button>
                </div>
                <button onClick={() => setShowRecurringForm(true)} className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-glow-blue hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recurringTasks.map(rt => {
                  const isDoneToday = rt.completedDates.includes(selectedDate);
                  return (
                    <div key={rt.id} className={`p-8 bg-slate-900/60 border rounded-[40px] h-[300px] flex flex-col justify-between group transition-all relative overflow-visible ${isDoneToday ? 'border-green-500/30 bg-green-500/5' : 'border-slate-800 hover:border-purple-500/40 shadow-xl'}`}>
                      {sparkleTaskId === rt.id && <SparkleParticles />}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`p-4 rounded-2xl transition-colors ${isDoneToday ? 'bg-green-600/10 text-green-400' : 'bg-purple-600/10 text-purple-400'}`}><Repeat size={24}/></div>
                          <EnergyBadge energy={rt.energy} onClick={() => updateRecurringTaskEnergy(rt.id)} highlighted />
                        </div>
                        <h3 className={`text-xl font-black uppercase transition-all ${isDoneToday ? 'opacity-40 line-through' : ''}`}>{rt.text}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleRecurringTask(rt.id)} className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all ${isDoneToday ? 'bg-green-600/20 text-green-500 border border-green-600/30' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-glow-blue'}`}>
                          {isDoneToday ? 'Reativar' : 'Concluir'}
                        </button>
                        <button onClick={() => setRecurringTasks(prev => prev.filter(p => p.id !== rt.id))} className="p-3 bg-red-600/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
              <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                   <h2 className="text-4xl font-black italic uppercase text-orange-600">Hábitos</h2>
                   <button onClick={() => setHabitsGuideStep(0)} className="p-2 text-slate-500 hover:text-white transition-colors">
                      <HelpCircle size={24}/>
                   </button>
                </div>
                <button onClick={() => setShowHabitForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {habits.map(h => {
                  const isDoneToday = h.lastCompleted === selectedDate;
                  return (
                    <div key={h.id} className={`p-8 rounded-[40px] border transition-all min-h-[380px] flex flex-col justify-between ${isDoneToday ? 'bg-green-600/5 border-green-500/30 shadow-inner opacity-70' : 'bg-slate-900/60 border-slate-800 shadow-xl'}`}>
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <Flame className={h.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-800"} size={28} />
                          <div className="text-right flex items-baseline gap-1">
                            <span className="text-4xl font-black italic leading-none">{h.streak}</span>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">Dias</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">O Hábito</label>
                            <input 
                              className="w-full bg-transparent border-none text-xl font-black uppercase outline-none focus:text-orange-500 transition-colors"
                              value={h.text}
                              onChange={(e) => updateHabit(h.id, { text: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Âncora (Depois de...)</label>
                            <input 
                              className="w-full bg-slate-800/40 p-2 rounded-xl border border-transparent focus:border-orange-500/30 text-xs font-bold text-slate-400 outline-none transition-all"
                              value={h.anchor}
                              onChange={(e) => updateHabit(h.id, { anchor: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Ação (Eu vou...)</label>
                            <input 
                              className="w-full bg-slate-800/40 p-2 rounded-xl border border-transparent focus:border-orange-500/30 text-xs font-bold text-slate-200 outline-none transition-all"
                              value={h.tinyAction}
                              onChange={(e) => updateHabit(h.id, { tinyAction: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-6">
                        <button onClick={() => completeHabit(h.id)} disabled={isDoneToday} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${isDoneToday ? 'bg-green-600/20 text-green-500 border border-green-600/20' : 'bg-orange-600 text-white hover:bg-orange-500 active:scale-95 shadow-glow-orange'}`}>
                          {isDoneToday ? 'Consolidado' : 'Reforçar Sinapse'}
                        </button>
                        <button onClick={() => setHabits(prev => prev.filter(p => p.id !== h.id))} className="p-4 bg-slate-800/50 text-slate-600 hover:text-red-500 rounded-2xl transition-all hover:bg-red-500/10">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upgrades' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="px-4">
                 <h2 className="text-4xl font-black italic uppercase text-orange-600">Árvore de Habilidades</h2>
                 <p className="text-xs text-slate-500 mt-1">Sua neuroplasticidade em forma de progressão.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {LEVELS.map(l => {
                  const isUnlocked = points >= l.minPoints;
                  const isCurrent = neuralProfile.level === l.level;
                  return (
                    <div key={l.level} className={`p-8 rounded-[48px] border transition-all flex flex-col justify-between ${isUnlocked ? 'bg-[#0a1128] border-orange-500/20 shadow-2xl ring-1 ring-orange-500/10' : 'bg-slate-900/20 border-slate-800/50 grayscale opacity-40'} ${isCurrent ? 'animate-pulse-orange border-orange-500' : ''}`}>
                       <div>
                          <div className="flex justify-between items-start mb-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUnlocked ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                               {/* Fix: use Zap icon from lucide-react */}
                               {l.level < 5 ? <Zap size={20}/> : l.level < 8 ? <Brain size={20}/> : <StarIcon size={20}/>}
                             </div>
                             <span className="text-[10px] font-black uppercase text-slate-500">{l.minPoints} XP</span>
                          </div>
                          <h3 className="text-2xl font-black uppercase mb-2">{l.title}</h3>
                          <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck size={14} className={isUnlocked ? 'text-green-500' : 'text-slate-700'}/>
                            <p className="text-[10px] font-black uppercase text-slate-500">{l.unlock}</p>
                          </div>
                       </div>
                       {isUnlocked && l.themeId && (
                         <button onClick={() => handleThemeChange(l.themeId!)} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${visualTheme === l.themeId ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                           {visualTheme === l.themeId ? 'Estilo Ativo' : 'Ativar Estilo'}
                         </button>
                       )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
            <div className="space-y-10 animate-in fade-in duration-700 relative">
               <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                   <h2 className="text-4xl font-black italic uppercase text-orange-600">Dopamenu</h2>
                   <button onClick={() => setDopamenuGuideStep(0)} className="p-2 text-slate-500 hover:text-white transition-colors">
                      <HelpCircle size={24}/>
                   </button>
                </div>
                <button onClick={() => setShowDopamenuForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Starter', 'Main', 'Side', 'Dessert'].map((category) => (
                  <div key={category} className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-[48px] space-y-6 relative group">
                    <h3 className="text-xl font-black uppercase italic text-orange-500">{category}</h3>
                    <div className="space-y-4">
                      {dopamenuItems.filter(item => item.category === category).map(item => (
                        <div key={item.id} className="p-6 bg-slate-800/20 border border-slate-700/30 rounded-3xl flex justify-between items-start transition-all hover:border-slate-600">
                          <div><h4 className="font-bold text-sm text-orange-400">{item.label}</h4><p className="text-[11px] text-slate-500">{item.description}</p></div>
                          <button onClick={() => removeDopamenuItem(item.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TUTORIAL OVERLAYS */}
      <GuideOverlay step={captureGuideStep} steps={CAPTURA_GUIDE_STEPS} onNext={() => nextGuideStep(captureGuideStep, CAPTURA_GUIDE_STEPS, setCaptureGuideStep)} onClose={() => setCaptureGuideStep(null)} />
      <GuideOverlay step={focusGuideStep} steps={FOCUS_GUIDE_STEPS} onNext={() => nextGuideStep(focusGuideStep, FOCUS_GUIDE_STEPS, setFocusGuideStep)} onClose={() => setFocusGuideStep(null)} />
      <GuideOverlay step={routinesGuideStep} steps={ROUTINES_GUIDE_STEPS} onNext={() => nextGuideStep(routinesGuideStep, ROUTINES_GUIDE_STEPS, setRoutinesGuideStep)} onClose={() => setRoutinesGuideStep(null)} />
      <GuideOverlay step={habitsGuideStep} steps={HABITS_GUIDE_STEPS} onNext={() => nextGuideStep(habitsGuideStep, HABITS_GUIDE_STEPS, setHabitsGuideStep)} onClose={() => setHabitsGuideStep(null)} />
      <GuideOverlay step={matrixGuideStep} steps={MATRIX_GUIDE_STEPS} onNext={() => nextGuideStep(matrixGuideStep, MATRIX_GUIDE_STEPS, setMatrixGuideStep)} onClose={() => setMatrixGuideStep(null)} />
      <GuideOverlay step={dopamenuGuideStep} steps={DOPAMENU_GUIDE_STEPS} onNext={() => nextGuideStep(dopamenuGuideStep, DOPAMENU_GUIDE_STEPS, setDopamenuGuideStep)} onClose={() => setDopamenuGuideStep(null)} />

      {/* Global Onboarding Overlay */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-[#0a1128] border border-orange-500/20 rounded-[56px] p-10 md:p-16 text-center space-y-10 shadow-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
                <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}></div>
             </div>
             <div className="relative flex justify-center mb-4">
                <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full scale-150"></div>
                <div className="relative p-8 bg-slate-900/50 rounded-full border border-orange-500/20 shadow-inner">
                   {TUTORIAL_STEPS[tutorialStep].icon}
                </div>
             </div>
             <div className="space-y-6">
                <h2 className="text-4xl font-black uppercase italic text-orange-500 tracking-tighter mb-2 animate-in slide-in-from-top-4 duration-500">{TUTORIAL_STEPS[tutorialStep].title}</h2>
                <div className="bg-slate-900/80 p-6 rounded-[32px] border border-slate-800/50 text-left shadow-2xl">
                   <div className="flex gap-4 items-start">
                      <BrainCog className="text-orange-500 shrink-0 mt-1" size={20}/><p className="text-sm text-slate-300 italic leading-relaxed">"{TUTORIAL_STEPS[tutorialStep].theory}"</p>
                   </div>
                </div>
                <div className="text-left pl-4 border-l-2 border-orange-600/30"><p className="text-base text-slate-200 font-medium leading-relaxed">{TUTORIAL_STEPS[tutorialStep].description}</p></div>
             </div>
             <div className="flex flex-col gap-4 pt-4">
                <button onClick={nextTutorialStep} className="w-full py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-glow-orange flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95">{tutorialStep === TUTORIAL_STEPS.length - 1 ? "Ativar Neurônios" : "Próxima Camada"}<ArrowRight size={24}/></button>
                <button onClick={skipTutorial} className="text-slate-600 hover:text-slate-400 font-black uppercase text-[10px] tracking-widest transition-colors">Pular Tutorial</button>
             </div>
          </div>
        </div>
      )}

      {/* Task detail and sync modals */}
      {editingTask && (
        <div className="fixed inset-0 z-[4500] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0a1128] border border-orange-500/20 rounded-[48px] p-10 space-y-8 shadow-3xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-start">
                <div className="flex-1 space-y-1">
                   <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Detalhes da Meta</h2>
                   <input className="w-full bg-transparent border-none text-3xl font-black outline-none text-white focus:text-orange-500 transition-colors" value={editingTask.text} onChange={e => { const updated = { ...editingTask, text: e.target.value }; setEditingTask(updated); updateTask(editingTask.id, { text: e.target.value }); }} />
                </div>
                <button onClick={() => setEditingTask(null)} className="p-4 bg-slate-800/50 rounded-2xl hover:text-red-500 transition-all"><X size={20}/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Calendar size={12}/> Data de Execução</label>
                   <input type="date" className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-orange-500 transition-all font-bold text-sm" value={editingTask.date} onChange={e => { const updated = { ...editingTask, date: e.target.value }; setEditingTask(updated); updateTask(editingTask.id, { date: e.target.value }); }} />
                </div>
                <div className="space-y-2">
                   {/* Fix: use Zap icon from lucide-react */}
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Zap size={12}/> Carga Neural</label>
                   <div className="flex gap-2">
                      {['Baixa', 'Média', 'Alta'].map(e => (
                        <button key={e} onClick={() => { const updated = { ...editingTask, energy: e as any }; setEditingTask(updated); updateTask(editingTask.id, { energy: e as any }); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${editingTask.energy === e ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800 text-slate-500'}`}>{e}</button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><ListChecks size={12}/> Sub-metas (Chunking)</label>
                  <button onClick={() => handleDecompose(editingTask)} disabled={isDecomposing} className="text-[9px] font-black uppercase text-orange-500 hover:text-orange-400 flex items-center gap-1">{isDecomposing ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} Sugerir via IA</button>
                </div>
                <div className="space-y-3">
                   {editingTask.subtasks.map((s, idx) => (
                     <div key={idx} className="flex gap-3 group">
                        <div className="flex-1 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3">
                           <span className="text-[10px] font-black text-orange-500">{idx+1}</span>
                           <input className="bg-transparent border-none outline-none flex-1 text-sm font-medium" value={s} onChange={e => { const newSubs = [...editingTask.subtasks]; newSubs[idx] = e.target.value; const updated = { ...editingTask, subtasks: newSubs }; setEditingTask(updated); updateTask(editingTask.id, { subtasks: newSubs }); }} />
                        </div>
                        <button onClick={() => { const newSubs = editingTask.subtasks.filter((_, i) => i !== idx); const updated = { ...editingTask, subtasks: newSubs }; setEditingTask(updated); updateTask(editingTask.id, { subtasks: newSubs }); }} className="p-4 bg-red-600/5 text-red-500/30 hover:text-red-500 transition-all rounded-2xl opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     </div>
                   ))}
                   <button onClick={() => { const newSubs = [...editingTask.subtasks, ""]; const updated = { ...editingTask, subtasks: newSubs }; setEditingTask(updated); updateTask(editingTask.id, { subtasks: newSubs }); }} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:border-orange-500/30 hover:text-orange-500 transition-all flex items-center justify-center gap-2"><Plus size={14}/> Adicionar Sub-meta</button>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><StickyNote size={12}/> Notas e Contexto</label>
                <textarea className="w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none focus:border-orange-500 transition-all font-medium text-sm min-h-[120px] resize-none" placeholder="Instruções, links ou gatilhos para começar..." value={editingTask.notes || ""} onChange={e => { const updated = { ...editingTask, notes: e.target.value }; setEditingTask(updated); updateTask(editingTask.id, { notes: e.target.value }); }} />
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={() => { setSelectedTask(editingTask); setActiveTab('execute'); setEditingTask(null); }} className="flex-1 py-6 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-orange flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"><Play size={20} fill="currentColor"/> Focar Agora</button>
                <button onClick={() => { setTasks(prev => prev.filter(t => t.id !== editingTask.id)); setEditingTask(null); }} className="p-6 bg-red-600/10 text-red-500 rounded-3xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={24}/></button>
             </div>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0a1128] border border-blue-500/20 rounded-[56px] p-12 space-y-8 shadow-3xl">
             <div className="flex justify-center"><CloudSync size={64} className="text-blue-500"/></div>
             <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-blue-500">Ativar NeuroSync</h2>
                <p className="text-slate-400 text-sm">Insira seu e-mail para sincronizar seu progresso entre PC, celular e tablet instantaneamente.</p>
             </div>
             <form onSubmit={handleSetEmail} className="space-y-6">
                <div className="relative">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                   <input type="email" placeholder="seu@email.com" required className="w-full py-5 pl-16 pr-8 bg-slate-900 border border-slate-800 rounded-3xl outline-none focus:border-blue-500 transition-all font-bold" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-glow-blue hover:bg-blue-500 transition-all">Sincronizar Agora</button>
             </form>
             <button onClick={() => setShowSyncModal(false)} className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest">Fechar</button>
          </div>
        </div>
      )}

      {/* Common Forms */}
      {showHabitForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addHabit} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-orange-600 uppercase">Novo Hábito</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Hábito" value={habitForm.text} onChange={e => setHabitForm({...habitForm, text: e.target.value})} />
              <input className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Âncora" value={habitForm.anchor} onChange={e => setHabitForm({...habitForm, anchor: e.target.value})} />
              <input className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Ação" value={habitForm.tinyAction} onChange={e => setHabitForm({...habitForm, tinyAction: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 rounded-3xl font-black uppercase shadow-glow-orange hover:bg-orange-500 transition-all">Solidificar</button>
            <button type="button" onClick={() => setShowHabitForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}

      {showRecurringForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addRecurringTask} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-purple-400 uppercase">Nova Rotina</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-purple-500 transition-colors" placeholder="Tarefa Recorrente" value={recurringForm.text} onChange={e => setRecurringForm({...recurringForm, text: e.target.value})} />
              <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none appearance-none border border-slate-800 focus:border-purple-500 transition-colors" value={recurringForm.energy} onChange={e => setRecurringForm({...recurringForm, energy: e.target.value as any})}>
                <option value="Baixa">Baixa Energia</option><option value="Média">Energia Média</option><option value="Alta">Alta Energia</option>
              </select>
            </div>
            <button type="submit" className="w-full py-5 bg-purple-600 rounded-3xl font-black uppercase shadow-glow-blue hover:bg-purple-500 transition-all">Ativar Ciclo</button>
            <button type="button" onClick={() => setShowRecurringForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}

      {showDopamenuForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addDopamenuItem} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-orange-600 uppercase">Novo Item</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Atividade" value={dopamenuForm.label} onChange={e => setDopamenuForm({...dopamenuForm, label: e.target.value})} />
              <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none appearance-none border border-slate-800 focus:border-orange-500 transition-colors" value={dopamenuForm.category} onChange={e => setDopamenuForm({...dopamenuForm, category: e.target.value as any})}>
                <option value="Starter">Starter</option><option value="Main">Main</option><option value="Side">Side</option><option value="Dessert">Dessert</option>
              </select>
              <input className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Descrição" value={dopamenuForm.description} onChange={e => setDopamenuForm({...dopamenuForm, description: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 rounded-3xl font-black uppercase shadow-glow-orange hover:bg-orange-500 transition-all">Adicionar</button>
            <button type="button" onClick={() => setShowDopamenuForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
};

/* REUSABLE GUIDE COMPONENT */
const GuideOverlay: React.FC<{ step: number | null, steps: any[], onNext: () => void, onClose: () => void }> = ({ step, steps, onNext, onClose }) => {
  if (step === null) return null;
  const current = steps[step];
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
       <div className="w-full max-w-xl bg-[#0a1128] border border-orange-500/20 rounded-[56px] p-10 text-center space-y-8 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
             <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
          </div>
          <div className="flex justify-center mb-4">{current.icon}</div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black uppercase italic text-orange-500 tracking-tighter">{current.title}</h2>
             <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800/50 text-left">
                <p className="text-sm text-slate-300 italic leading-relaxed">"{current.theory}"</p>
             </div>
             <p className="text-base text-slate-200 font-medium leading-relaxed px-4">{current.description}</p>
          </div>
          <div className="flex flex-col gap-4 pt-4">
             <button onClick={onNext} className="w-full py-5 bg-orange-600 text-white rounded-[32px] font-black uppercase tracking-widest shadow-glow-orange flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
               {step === steps.length - 1 ? "Entendido!" : "Próximo Passo"}
               <ArrowRight size={20}/>
             </button>
             <button onClick={onClose} className="text-slate-600 uppercase text-[10px] font-black tracking-widest transition-colors hover:text-slate-400">Fechar Guia</button>
          </div>
       </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all md:flex-row md:justify-start md:gap-5 md:w-full md:px-8 md:py-5 min-w-[80px] ${active ? 'bg-orange-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800/30'}`}>
    {icon}<span className="text-[10px] mt-2 font-black uppercase md:text-sm md:mt-0 md:tracking-widest whitespace-nowrap">{label}</span>
  </button>
);

const EnergyBadge: React.FC<{ energy: Task['energy'], onClick?: () => void, highlighted?: boolean }> = ({ energy, onClick, highlighted }) => {
  const colors = { 
    'Baixa': highlighted ? 'bg-green-600 text-white shadow-glow-success' : 'bg-green-600/20 text-green-500', 
    'Média': highlighted ? 'bg-yellow-600 text-white shadow-glow-orange' : 'bg-yellow-600/20 text-yellow-500', 
    'Alta': highlighted ? 'bg-red-600 text-white shadow-glow-red' : 'bg-red-600/20 text-red-500' 
  };
  return (
    <span 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${colors[energy] || colors['Média']}`}
    >
      {energy}
    </span>
  );
};

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void, onUpdateEnergy: (id: string) => void, currentArousal: BrainCapacity }> = ({ priority, title, color, tasks, onSelect, onDrop, onUpdateEnergy, currentArousal }) => {
  const isCompatible = (taskEnergy: Task['energy']) => {
    if (currentArousal === 'Exausto') return taskEnergy === 'Baixa';
    if (currentArousal === 'Neutro') return taskEnergy === 'Baixa' || taskEnergy === 'Média';
    return true;
  };
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const tid = e.dataTransfer.getData("taskId"); if(tid) onDrop(tid, priority); }} className={`p-10 border rounded-[56px] ${color} min-h-[380px] transition-all group overflow-hidden shadow-sm hover:shadow-md`}>
      <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-500 mb-8">{title}</h3>
      <div className="space-y-4">
        {tasks.map(t => {
          const compatible = isCompatible(t.energy);
          return (
            <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData("taskId", t.id)} className={`p-6 bg-slate-900 border rounded-3xl flex justify-between items-center group cursor-grab shadow-lg transition-all ${compatible ? 'border-orange-500/30 hover:border-orange-500/60' : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-100'}`}>
              <span onClick={() => onSelect(t)} className="text-sm font-black truncate flex-1 hover:text-orange-500 transition-colors">{t.text}</span>
              <EnergyBadge energy={t.energy} highlighted={compatible} onClick={() => onUpdateEnergy(t.id)} />
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-center py-20 text-[9px] font-black text-slate-700 uppercase tracking-widest opacity-30">Livre de pendências</p>}
      </div>
    </div>
  );
};

export default App;
