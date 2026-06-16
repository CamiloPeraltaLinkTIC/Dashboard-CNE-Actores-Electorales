import { NextResponse } from 'next/server';
import { getDb } from '@/lib/supabase';
import { requireEditor } from '@/lib/auth/access';

const supabase = getDb("estrategia");

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('manual_metrics')
      .select('*');

    if (error) throw error;

    // Convert array to object for easier use
    const metrics = data.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    // Fallback to empty object if DB is not set up
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  const guard = await requireEditor();
  if ("error" in guard) return guard.error;
  try {
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('manual_metrics')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving metric:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
