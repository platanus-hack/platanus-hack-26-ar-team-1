import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const doctorId = req.nextUrl.searchParams.get('doctor_id');
  if (!doctorId) {
    return NextResponse.json({ error: 'doctor_id required' }, { status: 400 });
  }

  const { data: patients, error: pError } = await supabase
    .from('patients')
    .select('id')
    .eq('doctor_id', doctorId);

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

  const patientIds = (patients ?? []).map((p) => p.id);
  if (patientIds.length === 0) return NextResponse.json({ prescriptions: [] });

  const { data: prescriptions, error } = await supabase
    .from('prescriptions')
    .select('*, patients(name, phone_number)')
    .in('patient_id', patientIds)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prescriptions });
}

export async function POST(req: NextRequest) {
  const { patient_id, drug_name, dosage, frequency, notes } = await req.json();

  if (!patient_id || !drug_name || !dosage || !frequency) {
    return NextResponse.json(
      { error: 'patient_id, drug_name, dosage, and frequency are required' },
      { status: 400 }
    );
  }

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .insert({ patient_id, drug_name, dosage, frequency, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prescription }, { status: 201 });
}
