import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const doctorId = req.nextUrl.searchParams.get('doctor_id');
  if (!doctorId) {
    return NextResponse.json({ error: 'doctor_id required' }, { status: 400 });
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const { name, phone_number, drug_name, doctor_id } = await req.json();

  if (!name || !phone_number || !drug_name || !doctor_id) {
    return NextResponse.json(
      { error: 'name, phone_number, drug_name, and doctor_id are required' },
      { status: 400 }
    );
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ name, phone_number, drug_name, doctor_id, status: 'pending' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ patient }, { status: 201 });
}
