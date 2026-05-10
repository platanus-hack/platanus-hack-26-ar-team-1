import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { setDoctorSession } from '@/lib/doctor-session';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !doctor) {
    return NextResponse.json({ error: 'Doctor not found. Please register first.' }, { status: 404 });
  }

  const response = NextResponse.json({ doctor });
  try {
    setDoctorSession(response, doctor.id);
  } catch {
    return NextResponse.json({ error: 'doctor session is not configured' }, { status: 503 });
  }
  return response;
}
