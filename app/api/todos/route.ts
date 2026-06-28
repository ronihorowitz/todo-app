import { NextResponse } from 'next/server';
import { getAllTodos, createTodo } from '@/lib/db';

export async function GET() {
  const todos = getAllTodos();
  return NextResponse.json(todos);
}

export async function POST(request: Request) {
  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }
  const todo = createTodo(text.trim());
  return NextResponse.json(todo, { status: 201 });
}
