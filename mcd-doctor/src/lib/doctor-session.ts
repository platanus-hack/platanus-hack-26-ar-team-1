import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'mcd_doctor_session';

function sessionSecret(): string | null {
  return process.env.DOCTOR_SESSION_SECRET || null;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function setDoctorSession(res: NextResponse, doctorId: string) {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error('DOCTOR_SESSION_SECRET is not configured');
  }
  const signature = sign(doctorId, secret);
  res.cookies.set(COOKIE_NAME, `${doctorId}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function doctorIdFromSession(req: NextRequest): string | null {
  const secret = sessionSecret();
  const value = req.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !value) return null;

  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const doctorId = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!doctorId || !signature) return null;

  return safeEqual(signature, sign(doctorId, secret)) ? doctorId : null;
}

export function requireDoctorSession(req: NextRequest): string | NextResponse {
  const doctorId = doctorIdFromSession(req);
  if (!doctorId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return doctorId;
}
