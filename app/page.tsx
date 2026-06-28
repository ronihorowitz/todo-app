'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  created_at: string;
}

function StreakDots({ streak }: { streak: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--fade)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        streak
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--fade)', margin: '0 2px' }}>[</span>
      {[1, 2, 3].map(n => (
        <span
          key={n}
          className={streak >= n ? 'streak-dot-filled' : ''}
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            background: streak >= n ? 'var(--amber)' : 'transparent',
            border: `1.5px solid ${streak >= n ? 'var(--amber)' : 'var(--rule)'}`,
            transition: 'background 0.2s, border-color 0.2s',
          }}
        />
      ))}
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--fade)', margin: '0 2px' }}>]</span>
      {streak > 0 && (
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--amber)' }}>
          {streak}/3
        </span>
      )}
    </div>
  );
}

function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,23,20,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
        cursor: 'pointer',
      }}
    >
      <div
        className="celebration-card"
        style={{
          background: 'var(--amber)',
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '16px' }}>★</div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '36px',
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '10px',
        }}>
          3-TASK STREAK
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '13px',
          color: 'var(--ink)',
          opacity: 0.7,
          letterSpacing: '0.05em',
        }}>
          keep going. you&apos;re on a roll.
        </div>
        <div style={{
          marginTop: '24px',
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          color: 'var(--ink)',
          opacity: 0.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          click to dismiss
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const streakRef = useRef(0);

  useEffect(() => {
    fetch('/api/todos')
      .then(r => r.json())
      .then(data => { setTodos(data); setLoading(false); });
  }, []);

  function celebrate() {
    setCelebrating(true);
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#E8A020', '#1A1714', '#F7F4EE'] });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#E8A020', '#1A1714', '#F7F4EE'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const todo = await res.json();
    setTodos(prev => [todo, ...prev]);
    setInput('');
  }

  async function toggleTodo(todo: Todo) {
    const completing = !todo.completed;
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: completing }),
    });
    const updated = await res.json();
    setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));

    if (completing) {
      const next = streakRef.current + 1;
      streakRef.current = next % 3;
      setStreak(next % 3);
      if (next % 3 === 0) celebrate();
    } else {
      streakRef.current = 0;
      setStreak(0);
    }
  }

  async function deleteTodo(id: number) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  const remaining = todos.filter(t => !t.completed).length;
  const done = todos.filter(t => t.completed).length;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', padding: '48px 16px' }}>
      {celebrating && <CelebrationOverlay onDone={() => setCelebrating(false)} />}

      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '40px',
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              lineHeight: 1,
              margin: 0,
            }}>
              TASKS
            </h1>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--fade)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {remaining} open · {done} done
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div style={{ marginBottom: '28px' }}>
          <StreakDots streak={streak} />
        </div>

        {/* Input */}
        <form onSubmit={addTodo} style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
          <span style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--card)',
            border: '1.5px solid var(--ink)',
            borderRight: 'none',
            padding: '0 12px',
            fontFamily: "'DM Mono', monospace",
            fontSize: '14px',
            color: 'var(--amber)',
            userSelect: 'none',
          }}>
            &gt;
          </span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="add a task..."
            style={{
              flex: 1,
              padding: '12px 14px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '14px',
              color: 'var(--ink)',
              background: 'var(--card)',
              border: '1.5px solid var(--ink)',
              borderRight: 'none',
              outline: 'none',
              borderRadius: 0,
            }}
            onFocus={e => e.target.style.background = '#FFFEF9'}
            onBlur={e => e.target.style.background = 'var(--card)'}
          />
          <button
            type="submit"
            style={{
              padding: '12px 20px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '13px',
              fontWeight: 500,
              background: 'var(--ink)',
              color: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              borderRadius: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'var(--amber)'; (e.target as HTMLButtonElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'var(--ink)'; (e.target as HTMLButtonElement).style.color = 'var(--paper)'; }}
          >
            ADD
          </button>
        </form>

        {/* List */}
        {loading ? (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'var(--fade)', textAlign: 'center', padding: '32px 0' }}>
            loading...
          </p>
        ) : todos.length === 0 ? (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'var(--fade)', textAlign: 'center', padding: '32px 0' }}>
            no tasks yet. type one above.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {todos.map(todo => (
              <li
                key={todo.id}
                className="todo-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--card)',
                  borderLeft: `3px solid ${todo.completed ? 'var(--rule)' : 'var(--amber)'}`,
                  padding: '12px 14px',
                  transition: 'border-color 0.25s',
                }}
              >
                {/* Prefix */}
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '14px',
                  color: todo.completed ? 'var(--rule)' : 'var(--amber)',
                  width: '14px',
                  flexShrink: 0,
                  transition: 'color 0.2s',
                  userSelect: 'none',
                }}>
                  {todo.completed ? '✓' : '>'}
                </span>

                {/* Checkbox (hidden, triggered by label) */}
                <input
                  type="checkbox"
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  style={{
                    flex: 1,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '14px',
                    color: todo.completed ? 'var(--fade)' : 'var(--ink)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    textDecorationColor: 'var(--amber)',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  {todo.text}
                </label>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '16px',
                    color: 'var(--rule)',
                    cursor: 'pointer',
                    padding: '0 2px',
                    lineHeight: 1,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#C0392B'}
                  onMouseLeave={e => (e.target as HTMLButtonElement).style.color = 'var(--rule)'}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer rule */}
        <div style={{ borderTop: '1px solid var(--rule)', marginTop: '40px', paddingTop: '12px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--rule)', letterSpacing: '0.06em' }}>
            complete 3 in a row to unlock a streak
          </span>
        </div>

      </div>
    </main>
  );
}
