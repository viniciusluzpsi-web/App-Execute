
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  ChevronRight, Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, Calendar as CalendarIcon,
  ChevronLeft, Repeat, Award, ZapOff, TrendingUp, Sun, Moon
} from 'lucide-react';
import { Priority, Task, Habit, IdentityBoost, PanicSolution, RecurringTask, Frequency } from './types';
import { geminiService } from './services/geminiService';

const SynapseLogo = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="logo-grad-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" />
    <path d="M16 8V4M16 28V24M8 16H4M28 16H24M10.3 10.3L7.5 7.5M24.5 24.5L21.7 21.7M10.3 21.7L7.5 24.5M24.5 7.5L21.7 10.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-40" />
    <path d="M22 10C24 12 25 15 25 18C25 22.4183 20.9706 26 16 26" stroke="url(#logo-grad-fire)" strokeWidth="2" strokeLinecap="round" className="spark-line" />
    <circle cx="16" cy="16" r="6" stroke="url(#logo-grad-fire)" strokeWidth="2" className="synapse-core" />
    <circle cx="16" cy="16" r="3" fill="url(#logo-grad-fire)" className="synapse-core" />
    <path d="M16 16L26 6" stroke="url(#logo-grad-fire)" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
    <circle cx="26" cy="6" r="2" fill="#ef4444" />
  </svg>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture'>('execute');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [points, setPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('neuro-theme') as 'light' | 'dark') || 'dark';
  });
  
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const [identityBoost, setIdentityBoost] = useState<IdentityBoost | null>(null);
  const [panicTask, setPanicTask] = useState<Task | null>(null);
  const [panicSolution, setPanicSolution] = useState<PanicSolution | null>(null);
  const [isRescuing, setIsRescuing] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  
  const [newTaskText, setNewTaskText] = useState("");
  const [obstacleInput, setObstacleInput] = useState("");
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  
  const [newHabit, setNewHabit] = useState({ text: "", anchor: "", tinyAction: "" });
  const [newRecurring, setNewRecurring] = useState({ text: "", frequency: Frequency.DAILY, priority: Priority.Q2 });

  const neuroLevel = useMemo(() => {
    if (points < 100) return { title: "Iniciante Neural", next: 100 };
    if (points < 500) return { title: "Arquiteto de Hábitos", next: 500 };
    if (points < 1500) return { title: "Mestre da Execução", next: 1500 };
    return { title: "Ninja da Neuroplasticidade", next: Infinity };
  }, [points]);

  useEffect(() => {
    localStorage.setItem('neuro-theme', theme);
  }, [theme]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = -2; i < 12; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        full: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        dayNum: date.getDate(),
        isToday: date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      });
    }
    return days;
  }, []);

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      priority: Priority.Q2,
      energy: 'Média',
      completed: false,
      subtasks: [],
      date: selectedDate,
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, task]);
    setNewTaskText("");
  };

  const addRecurringTask = () => {
    if (!newRecurring.text.trim()) return;
    const task: RecurringTask = {
      id: crypto.randomUUID(),
      text: newRecurring.text,
      frequency: newRecurring.frequency,
      priority: newRecurring.priority,
      energy: 'Média',
      completedDates: []
    };
    setRecurringTasks(prev => [...prev, task]);
    setNewRecurring({ text: "", frequency: Frequency.DAILY, priority: Priority.Q2 });
    setShowRecurringForm(false);
  };

  const addHabitAction = () => {
    if (!newHabit.text.trim()) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      text: newHabit.text,
      anchor: newHabit.anchor,
      tinyAction: newHabit.tinyAction,
      streak: 0,
      lastCompleted: null
    };
    setHabits(prev => [...prev, habit]);
    setNewHabit({ text: "", anchor: "", tinyAction: "" });
    setShowHabitForm(false);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isNowCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: isNowCompleted } : t));
    if (isNowCompleted) {
      setPoints(prev => prev + 15);
      try {
        const boostText = await geminiService.generateIdentityBoost(task.text);
        setIdentityBoost({ text: boostText, taskTitle: task.text });
        setTimeout(() => setIdentityBoost(null), 8000);
      } catch (err) { console.error(err); }
    } else {
      setPoints(prev => Math.max(0, prev - 15));
    }
  };

  const handleDecompose = async (task: Task) => {
    setIsDecomposing(true);
    try {
      const steps = await geminiService.decomposeTask(task.text);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: steps } : t));
      if (selectedTask?.id === task.id) {
        setSelectedTask(prev => prev ? { ...prev, subtasks: steps } : null);
      }
    } catch (e) { console.error(e); } finally { setIsDecomposing(false); }
  };

  const handleRescue = async () => {
    if (!panicTask || !obstacleInput.trim()) return;
    setIsRescuing(true);
    try {
      const solution = await geminiService.rescueTask(panicTask.text, obstacleInput);
      setPanicSolution(solution);
    } catch (e) { console.error(e); } finally { setIsRescuing(false); }
  };

  const moveTaskPriority = (taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`fixed bottom-0 w-full transition-colors duration-500 backdrop-blur-xl border-t md:static md:w-64 md:h-screen md:border-t-0 md:border-r z-50 ${isDark ? 'bg-[#0a1128]/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex items-center justify-between p-4 md:flex-col md:items-start md:p-8 md:mb-4">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-3 italic tracking-tight ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
              <SynapseLogo />
              EXECUTE
            </h1>
            <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Neuroprodutividade</p>
          </div>
          <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} md:mt-8`}>
            {isDark ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
        </div>
        <div className="flex justify-around p-2 md:flex-col md:gap-2 md:px-4">
          <NavButton isDark={isDark} icon={<Timer size={22}/>} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton isDark={isDark} icon={<LayoutGrid size={22}/>} label="Planejar" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton isDark={isDark} icon={<RefreshCw size={22}/>} label="Rotinas" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton isDark={isDark} icon={<ListTodo size={22}/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-8">
          <div className={`${isDark ? 'bg-[#0a1128]/50 border-slate-800/50' : 'bg-white border-slate-200 shadow-sm'} border rounded-[32px] p-4 overflow-x-auto`}>
            <div className="flex gap-3 min-w-max px-2">
              {calendarDays.map((day) => (
                <button key={day.full} onClick={() => setSelectedDate(day.full)} className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all ${selectedDate === day.full ? (isDark ? 'bg-orange-600 text-white animate-glow-orange scale-110 z-10' : 'bg-orange-600 text-white shadow-lg scale-110 z-10') : (isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100')}`}>
                  <span className="text-[10px] font-black uppercase tracking-tighter mb-1">{day.dayName}</span>
                  <span className="text-xl font-black">{day.dayNum}</span>
                  {day.isToday && <div className={`w-1 h-1 rounded-full mt-1 ${selectedDate === day.full ? 'bg-white' : 'bg-orange-500'}`} />}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'execute' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className={`border rounded-[40px] p-10 text-center shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                      <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(timeLeft / (90*60)) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 block text-slate-500">Ciclo Ultradiano</span>
                    <div className="text-[100px] leading-none font-black font-mono tracking-tighter tabular-nums mb-10">{formatTime(timeLeft)}</div>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => setIsTimerActive(!isTimerActive)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isTimerActive ? 'bg-slate-800 text-slate-400' : 'bg-orange-600 text-white shadow-xl animate-glow-orange'}`}>
                        {isTimerActive ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                      </button>
                      <button onClick={() => { setIsTimerActive(false); setTimeLeft(90*60); }} className="w-16 h-16 rounded-3xl flex items-center justify-center bg-slate-800 text-slate-500"><RotateCcw size={24} /></button>
                    </div>
                  </div>

                  <div className={`border rounded-[40px] p-8 min-h-[300px] ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                    {selectedTask ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-3xl font-black">{selectedTask.text}</h2>
                            <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-600/20 text-orange-400 animate-pulse-orange">
                              {selectedTask.priority}
                            </span>
                          </div>
                          <button onClick={() => setPanicTask(selectedTask)} className="p-3 bg-orange-600/10 text-orange-600 rounded-2xl hover:bg-orange-600 hover:text-white transition-all"> <AlertTriangle size={24} /> </button>
                        </div>
                        <div className="space-y-4">
                          {selectedTask.subtasks.length > 0 ? selectedTask.subtasks.map((step, i) => (
                            <div key={i} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="w-8 h-8 rounded-full border border-orange-500/30 flex items-center justify-center font-black text-xs text-orange-400">{i + 1}</div>
                              <p className="text-sm font-medium">{step}</p>
                            </div>
                          )) : (
                            <button onClick={() => handleDecompose(selectedTask)} disabled={isDecomposing} className="w-full py-16 border-2 border-dashed border-slate-800 rounded-[40px] text-slate-500 hover:text-orange-400 hover:border-orange-500/40 transition-all flex flex-col items-center gap-4">
                              {isDecomposing ? <BrainCircuit className="animate-spin" size={40}/> : <><Sparkles size={40}/><span className="font-bold">Decompor com IA</span></>}
                            </button>
                          )}
                        </div>
                        <button onClick={() => toggleTask(selectedTask.id)} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Finalizar</button>
                      </div>
                    ) : <div className="py-24 text-center opacity-30 text-slate-400"><Anchor size={60} className="mx-auto mb-4"/><p>Selecione uma tarefa</p></div>}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={`border rounded-[32px] p-6 ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-black uppercase text-slate-500 mb-4">Tarefas do Dia</h3>
                    <div className="space-y-2">
                      {dayTasks.filter(t => !t.completed).map(t => (
                        <button key={t.id} onClick={() => setSelectedTask(t)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedTask?.id === t.id ? 'bg-orange-600/10 border-orange-500 text-white' : 'border-slate-800 text-slate-500'}`}>
                          <span className="text-xs font-bold truncate">{t.text}</span>
                        </button>
                      ))}
                      {dayTasks.filter(t => !t.completed).length === 0 && (
                        <p className="text-xs text-slate-500 text-center italic py-4">Sem tarefas pendentes.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
               <h2 className="text-3xl font-black italic">Matriz de Decisão</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <MatrixQuadrant isDark={isDark} priority={Priority.Q1} title="Q1: Fazer Agora" desc="Urgente" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={setSelectedTask} onTabChange={() => setActiveTab('execute')} onMoveTask={moveTaskPriority} />
                 <MatrixQuadrant isDark={isDark} priority={Priority.Q2} title="Q2: Estratégico" desc="Importante" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={setSelectedTask} onTabChange={() => setActiveTab('execute')} onMoveTask={moveTaskPriority} />
                 <MatrixQuadrant isDark={isDark} priority={Priority.Q3} title="Q3: Delegar" desc="Interrupções" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={setSelectedTask} onTabChange={() => setActiveTab('execute')} onMoveTask={moveTaskPriority} />
                 <MatrixQuadrant isDark={isDark} priority={Priority.Q4} title="Q4: Eliminar" desc="Trivial" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={setSelectedTask} onTabChange={() => setActiveTab('execute')} onMoveTask={moveTaskPriority} />
               </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`col-span-2 border p-8 rounded-[40px] flex items-center justify-between ${isDark ? 'bg-[#0a1128] border-orange-500/30' : 'bg-white border-orange-100 shadow-lg'}`}>
                   <div>
                     <p className="text-[10px] font-black uppercase text-orange-400">Progresso Executivo</p>
                     <h3 className="text-3xl font-black italic">{neuroLevel.title}</h3>
                     <div className="mt-4 flex items-center gap-4">
                       <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(100, (points / neuroLevel.next) * 100)}%` }}></div>
                       </div>
                       <span className="text-xs font-mono">{points} XP</span>
                     </div>
                   </div>
                   <Award className="text-orange-500" size={48}/>
                </div>
                <div className={`border p-8 rounded-[40px] flex flex-col items-center justify-center text-center ${isDark ? 'bg-[#0a1128] border-orange-500/30' : 'bg-white border-orange-100 shadow-lg'}`}>
                  <TrendingUp className="text-orange-500 mb-2" size={24}/>
                  <p className="text-[10px] font-black uppercase text-orange-400">Dopamina</p>
                  <p className="text-4xl font-black">{points}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowRecurringForm(!showRecurringForm); setShowHabitForm(false); }} className={`px-6 py-3 border rounded-2xl font-bold flex items-center gap-2 transition-all ${showRecurringForm ? 'bg-orange-600 text-white' : 'border-slate-800'}`}> <Repeat size={18}/> Tarefa Fixa </button>
                <button onClick={() => { setShowHabitForm(!showHabitForm); setShowRecurringForm(false); }} className={`px-6 py-3 border rounded-2xl font-bold flex items-center gap-2 transition-all ${showHabitForm ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white'}`}> <Flame size={18}/> Novo Hábito </button>
              </div>

              {/* Forms Section */}
              {showRecurringForm && (
                <div className={`p-8 border rounded-[32px] animate-in slide-in-from-top ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
                  <h4 className="font-black uppercase text-sm mb-4">Nova Tarefa Fixa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="Ex: Revisão Semanal" value={newRecurring.text} onChange={e => setNewRecurring({...newRecurring, text: e.target.value})} />
                    <select className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} value={newRecurring.frequency} onChange={e => setNewRecurring({...newRecurring, frequency: e.target.value as Frequency})}>
                      {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <button onClick={addRecurringTask} className="mt-4 w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase">Adicionar ao Fluxo</button>
                </div>
              )}

              {showHabitForm && (
                <div className={`p-8 border rounded-[32px] animate-in slide-in-from-top ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
                  <h4 className="font-black uppercase text-sm mb-4">Novo Hábito Atômico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="O Hábito" value={newHabit.text} onChange={e => setNewHabit({...newHabit, text: e.target.value})} />
                    <input className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="Âncora (Quando...)" value={newHabit.anchor} onChange={e => setNewHabit({...newHabit, anchor: e.target.value})} />
                    <input className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} placeholder="Micro-ação" value={newHabit.tinyAction} onChange={e => setNewHabit({...newHabit, tinyAction: e.target.value})} />
                  </div>
                  <button onClick={addHabitAction} className="mt-4 w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase">Implementar</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-500"><Flame size={14}/> Seus Hábitos</h3>
                  {habits.map(habit => (
                    <div key={habit.id} className={`border p-6 rounded-[28px] ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <h4 className="font-black text-lg">{habit.text}</h4>
                      <p className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {`"${habit.anchor}" → ${habit.tinyAction}`}
                      </p>
                      <button onClick={() => { setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: h.streak + 1 } : h)); setPoints(prev => prev + 25); }} className="mt-4 w-full py-2 border border-orange-500/30 text-orange-500 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all">Registrar (+25 XP)</button>
                    </div>
                  ))}
                  {habits.length === 0 && <p className="text-center text-xs opacity-40">Nenhum hábito ativo.</p>}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-500"><Repeat size={14}/> Suas Rotinas</h3>
                  {recurringTasks.map(rt => (
                    <div key={rt.id} className={`border p-6 rounded-[28px] ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <h4 className="font-black text-lg">{rt.text}</h4>
                      <p className="text-[10px] font-black uppercase text-orange-500 mt-1">{rt.frequency}</p>
                    </div>
                  ))}
                  {recurringTasks.length === 0 && <p className="text-center text-xs opacity-40">Nenhuma rotina fixa.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 text-center py-10">
              <h2 className="text-4xl font-black tracking-tighter">Capture seu Pensamento</h2>
              <div className={`p-8 rounded-[40px] shadow-2xl border ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex gap-4">
                  <input autoFocus className={`flex-1 bg-transparent border-none rounded-3xl px-6 py-6 text-xl outline-none focus:ring-2 focus:ring-orange-600 ${isDark ? 'text-white' : 'text-slate-900'}`} placeholder="O que está na sua mente?" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}/>
                  <button onClick={addTask} className="w-20 h-20 bg-orange-600 text-white rounded-3xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-900/40"> <Plus size={32} strokeWidth={3}/> </button>
                </div>
              </div>
              <div className="space-y-4 text-left">
                {dayTasks.filter(t => !t.completed).map(t => (
                  <div key={t.id} className={`p-6 border rounded-[28px] flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <span className="font-bold">{t.text}</span>
                    <button onClick={() => setTasks(tasks.filter(task => task.id !== t.id))} className="text-slate-500 hover:text-red-500 transition-colors"><X size={20}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {panicTask && (
        <div className="fixed inset-0 backdrop-blur-xl z-[200] flex items-center justify-center p-4 bg-[#020617]/95">
          <div className={`w-full max-w-xl border rounded-[48px] overflow-hidden ${isDark ? 'bg-[#0a1128] border-orange-500/30' : 'bg-white border-orange-100 shadow-2xl'}`}>
            <div className="p-8 border-b border-orange-600/20 flex justify-between items-center">
              <div className="flex items-center gap-4"><BrainCircuit className="text-orange-600" size={32} /><h3 className="font-black text-xl">Resgate Neural</h3></div>
              <button onClick={() => setPanicTask(null)}><X size={24}/></button>
            </div>
            <div className="p-10 space-y-6">
              {!panicSolution ? (
                <div className="space-y-6">
                  <textarea autoFocus className={`w-full border rounded-[32px] p-6 text-sm outline-none resize-none h-32 ${isDark ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="O que está impedindo você agora?" value={obstacleInput} onChange={e => setObstacleInput(e.target.value)}/>
                  <button onClick={handleRescue} disabled={isRescuing || !obstacleInput.trim()} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl"> {isRescuing ? "Analisando..." : "SOLICITAR RESGATE"} </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                  <p className="text-sm font-medium italic opacity-80">"{panicSolution.diagnosis}"</p>
                  <div className="space-y-3">
                    {panicSolution.steps.map((step, i) => (
                      <div key={i} className="flex gap-4 p-5 border rounded-3xl bg-slate-800/20 border-slate-700">
                        <div className="w-6 h-6 rounded-full border border-orange-500/30 flex items-center justify-center text-xs font-black">{i + 1}</div>
                        <p className="text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setPanicTask(null); setPanicSolution(null); }} className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black uppercase text-xs">Entendido</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {identityBoost && (
        <div className="fixed top-6 right-6 z-[200] w-80 p-6 rounded-3xl bg-orange-600 text-white shadow-2xl animate-in slide-in-from-right duration-500">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Dopamina Extra</p>
          <p className="text-sm font-medium italic">"{identityBoost.text}"</p>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ isDark: boolean, icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ isDark, icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all md:flex-row md:justify-start md:gap-4 md:w-full md:px-6 md:py-4 ${active ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>
    {icon}
    <span className="text-[9px] mt-1 font-black uppercase md:text-xs md:mt-0">{label}</span>
  </button>
);

const MatrixQuadrant: React.FC<{ 
  isDark: boolean, 
  priority: Priority, 
  title: string, 
  desc: string, 
  tasks: Task[], 
  onSelect: (t: Task) => void, 
  onTabChange: () => void, 
  onMoveTask: (taskId: string, newPriority: Priority) => void 
}> = ({ isDark, priority, title, desc, tasks, onSelect, onTabChange, onMoveTask }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onMoveTask(taskId, priority);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`h-[350px] border rounded-[40px] p-8 flex flex-col transition-all ${isDark ? 'border-slate-800 bg-slate-900/50' : 'bg-white border-slate-200'} ${isOver ? 'ring-2 ring-orange-500 ring-inset border-transparent' : ''}`}
    >
      <h4 className="font-black text-xl uppercase italic tracking-tighter">{title}</h4>
      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{desc}</p>
      <div className="flex-1 overflow-y-auto mt-6 space-y-2">
        {tasks.map(t => (
          <div 
            key={t.id} 
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("taskId", t.id);
            }}
            className="p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-orange-500/30 transition-all cursor-grab active:cursor-grabbing bg-[#0a1128]/40"
          >
            <span className="text-xs font-bold truncate opacity-80">{t.text}</span>
            <button onClick={() => { onSelect(t); onTabChange(); }} className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"> <Play size={12} fill="currentColor"/> </button>
          </div>
        ))}
        {tasks.length === 0 && <div className="h-full flex items-center justify-center opacity-10 border-2 border-dashed border-slate-700 rounded-3xl"><span className="text-[8px] uppercase font-black">Drop Here</span></div>}
      </div>
    </div>
  );
};

export default App;
