import { NextResponse } from 'next/server';
import { getDb } from '@/lib/supabase';

const supabase = getDb("estrategia");

export async function GET() {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const startDate = sixtyDaysAgo.toISOString().split('T')[0];

    // Fetch last 60 days to allow 30-day rolling calculations
    const { data, error } = await supabase
      .from('custos_metrics')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, ...metrics } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('custos_metrics')
      .upsert({ date, ...metrics, updated_at: new Date().toISOString() }, { onConflict: 'date' });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error saving metrics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
