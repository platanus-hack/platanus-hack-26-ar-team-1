import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireDoctorSession } from '@/lib/doctor-session';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { name, phone_number, drug_name } = await req.json();

  const { data: patient, error } = await supabase
    .from('patients')
    .update({ name, phone_number, drug_name })
    .eq('id', params.id)
    .eq('doctor_id', doctorId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  if (!patient) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const doctorId = requireDoctorSession(req);
  if (doctorId instanceof NextResponse) return doctorId;

  const { error } = await supabase.from('patients').delete().eq('id', params.id).eq('doctor_id', doctorId);

  if (error) return NextResponse.json({ error: 'database error' }, { status: 500 });
  return NextResponse.json({ success: true });
}
