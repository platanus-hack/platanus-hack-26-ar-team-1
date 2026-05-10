import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireDoctorSession } from '@/lib/doctor-session';

export async function GET(req: NextRequest) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { name, phone_number, drug_name } = await req.json();

  if (!name || !phone_number || !drug_name) {
    return NextResponse.json(
      { error: 'name, phone_number, and drug_name are required' },
      { status: 400 }
    );
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ name, phone_number, drug_name, doctor_id: doctorId, status: 'pending' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  return NextResponse.json({ patient }, { status: 201 });
}
