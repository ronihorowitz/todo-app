'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  created_at: string;
}

function StreakBar({ streak }: { streak: number }) {
  const dots = [1, 2, 3];
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs text-gray-400 font-medium">Streak</span>
      {dots.map(n => (
        <div
          key={n}
          className={`w-4 h-4 rounded-full transition-all duration-300 ${
            streak >= n ? 'bg-yellow-400 scale-110 shadow-md' : 'bg-gray-200'
          }`}
        />
      ))}
      {streak > 0 && (
        <span className="text-xs text-yellow-500 font-semibold ml-1">
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
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
      onClick={onDone}
    >
      <div className="text-center animate-bounce">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-2">
          3-Todo Streak!
        </h2>
        <p className="text-white/80 text-lg">You&apos;re on fire! Keep it up!</p>
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
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 } });
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
      // unchecking breaks the streak
      streakRef.current = 0;
      setStreak(0);
    }
  }

  async function deleteTodo(id: number) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  const remaining = todos.filter(t => !t.completed).length;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      {celebrating && <CelebrationOverlay onDone={() => setCelebrating(false)} />}

      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Todo List</h1>
        <p className="text-gray-500 mb-4 text-sm">
          {remaining} task{remaining !== 1 ? 's' : ''} remaining
        </p>

        <StreakBar streak={streak} />

        <form onSubmit={addTodo} className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Add
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No tasks yet. Add one above!</p>
        ) : (
          <ul className="space-y-2">
            {todos.map(todo => (
              <li
                key={todo.id}
                className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
