import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Plus, Check, X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember — Focus Timer" },
      { name: "description", content: "Stay in the zone with Ember: a warm focus timer with tasks and daily streaks." },
      { property: "og:title", content: "Ember — Focus Timer" },
      { property: "og:description", content: "Stay in the zone with Ember: a warm focus timer with tasks and daily streaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mode = "focus" | "short" | "long";
type Task = { id: string; text: string; done: boolean };

const MODES: Record<Mode, { label: string; minutes: number; hint: string }> = {
  focus: { label: "Focus", minutes: 25, hint: "Deep work. One thing." },
  short: { label: "Short break", minutes: 5, hint: "Stretch. Breathe. Water." },
  long: { label: "Long break", minutes: 15, hint: "Step away from the screen." },
};

const STORAGE_KEY = "ember:v1";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880, 990].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.65);
    });
  } catch {
    /* audio unavailable */
  }
}

function Index() {
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);
  const endAt = useRef<number | null>(null);

  const total = MODES[mode].minutes * 60;
  const progress = 1 - remaining / total;

  // Load saved state after hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const today = new Date().toDateString();
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (data.day === today && typeof data.sessions === "number") setSessions(data.sessions);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks, sessions, day: new Date().toDateString() }),
    );
  }, [tasks, sessions, loaded]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setRunning(false);
    endAt.current = null;
    setRemaining(MODES[m].minutes * 60);
  }, []);

  const complete = useCallback(() => {
    chime();
    if (mode === "focus") {
      const next = sessions + 1;
      setSessions(next);
      switchMode(next % 4 === 0 ? "long" : "short");
    } else {
      switchMode("focus");
    }
  }, [mode, sessions, switchMode]);

  useEffect(() => {
    if (!running) return;
    if (endAt.current === null) endAt.current = Date.now() + remaining * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        complete();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, complete]);

  useEffect(() => {
    document.title = running ? `${fmt(remaining)} · ${MODES[mode].label}` : "Ember — Focus Timer";
  }, [remaining, running, mode]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      endAt.current = null;
    } else {
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    endAt.current = null;
    setRemaining(total);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks((t) => [...t, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  };

  const R = 130;
  const C = 2 * Math.PI * R;
  const activeTask = tasks.find((t) => !t.done);

  return (
    <div data-mode={mode} className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-ambient animate-ember" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-ember-gradient text-primary-foreground">
              <Flame className="size-4" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">ember</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="font-mono text-foreground">{sessions}</span> today
          </div>
        </header>

        {/* Mode switch */}
        <nav className="mt-8 grid grid-cols-3 gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-full px-2 py-2 text-sm font-medium transition-all",
                mode === m
                  ? "bg-ember-gradient text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {MODES[m].label}
            </button>
          ))}
        </nav>

        {/* Timer ring */}
        <section className="relative mx-auto mt-10 aspect-square w-full max-w-[300px]">
          <svg viewBox="0 0 300 300" className="size-full -rotate-90">
            <defs>
              <linearGradient id="emberStroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--ember)" />
              </linearGradient>
            </defs>
            <circle cx="150" cy="150" r={R} fill="none" stroke="var(--track)" strokeWidth="10" />
            <circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke="url(#emberStroke)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.3s linear", filter: "drop-shadow(0 0 10px var(--ember-glow))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-6xl font-light tabular-nums tracking-tight sm:text-7xl">
              {fmt(remaining)}
            </span>
            <span className="mt-2 text-sm text-muted-foreground">{MODES[mode].hint}</span>
          </div>
        </section>

        {/* Session dots */}
        <div className="mt-6 flex justify-center gap-2" aria-label="Sessions until long break">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i < sessions % 4 || (sessions > 0 && sessions % 4 === 0 && mode === "long")
                  ? "bg-ember"
                  : "bg-track",
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            onClick={reset}
            aria-label="Reset timer"
            className="grid size-12 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-5" />
          </button>
          <button
            onClick={toggle}
            aria-label={running ? "Pause" : "Start"}
            className="grid size-20 place-items-center rounded-full bg-ember-gradient text-primary-foreground shadow-glow transition-transform active:scale-95"
          >
            {running ? <Pause className="size-8" fill="currentColor" /> : <Play className="ml-1 size-8" fill="currentColor" />}
          </button>
          <button
            onClick={complete}
            aria-label="Skip to next"
            className="grid size-12 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <SkipForward className="size-5" />
          </button>
        </div>

        {/* Current task */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {activeTask ? (
            <>
              Working on <span className="font-medium text-foreground">{activeTask.text}</span>
            </>
          ) : (
            "What are you working on?"
          )}
        </p>

        {/* Tasks */}
        <section className="mt-6 rounded-3xl border border-border bg-card/70 p-4 backdrop-blur">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="font-display text-base font-bold">Tasks</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {tasks.filter((t) => t.done).length}/{tasks.length}
            </span>
          </div>

          <form onSubmit={addTask} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task…"
              className="h-11 flex-1 rounded-xl border border-input bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <button
              type="submit"
              aria-label="Add task"
              className="grid size-11 place-items-center rounded-xl bg-ember-gradient text-primary-foreground"
            >
              <Plus className="size-5" />
            </button>
          </form>

          <ul className="mt-3 space-y-1">
            {tasks.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/60">
                <button
                  onClick={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                  aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                    t.done ? "border-transparent bg-ember text-primary-foreground" : "border-muted-foreground",
                  )}
                >
                  {t.done && <Check className="size-3" strokeWidth={3} />}
                </button>
                <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>{t.text}</span>
                <button
                  onClick={() => setTasks((all) => all.filter((x) => x.id !== t.id))}
                  aria-label="Delete task"
                  className="text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
            {loaded && tasks.length === 0 && (
              <li className="px-2 py-4 text-center text-xs text-muted-foreground">No tasks yet. Add one and light it up.</li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
