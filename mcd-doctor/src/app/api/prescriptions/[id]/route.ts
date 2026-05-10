import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireDoctorSession } from '@/lib/doctor-session';

async function patientBelongsToDoctor(patientId: string, doctorId: string) {
  const { data } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', doctorId)
    .maybeSingle();
  return Boolean(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { patient_id, drug_name, dosage, frequency, notes } = await req.json();

  const { data: existing } = await supabase
    .from('prescriptions')
    .select('patient_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!existing || !(await patientBelongsToDoctor(existing.patient_id, doctorId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (!(await patientBelongsToDoctor(patient_id, doctorId))) {
    return NextResponse.json({ error: 'patient not found' }, { status: 404 });
  }

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .update({ patient_id, drug_name, dosage, frequency, notes: notes || null })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  return NextResponse.json({ prescription });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { data: existing } = await supabase
    .from('prescriptions')
    .select('patient_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!existing || !(await patientBelongsToDoctor(existing.patient_id, doctorId))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const { error } = await supabase.from('prescriptions').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  return NextResponse.json({ success: true });
}
