'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { createHash, timingSafeEqual } from 'crypto';

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export async function verifyAdminToken(token?: string | null): Promise<boolean> {
  const adminPass = getAdminPassword();
  if (!adminPass || !token) return false;

  const expectedHash = createHash('sha256').update(adminPass).digest('hex');
  const a = Buffer.from(expectedHash);
  const b = Buffer.from(token);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function deleteQuestion(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value ?? '';
  if (!(await verifyAdminToken(sessionToken))) {
    redirect('/admin?error=1');
  }

  const id = formData.get('id');
  if (!id) {
    redirect('/admin?error=delete');
  }

  const { error } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    redirect('/admin?error=delete');
  }

  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function updateQuestion(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value ?? '';
  if (!(await verifyAdminToken(sessionToken))) {
    redirect('/admin?error=1');
  }

  const id = formData.get('id');
  const text = formData.get('text');
  const acceptedRaw = formData.get('accepted');

  if (!id || typeof text !== 'string' || typeof acceptedRaw !== 'string') {
    redirect('/admin?error=update');
  }

  const acceptedAnswers = acceptedRaw
    .split(',')
    .map((ans) => ans.trim())
    .filter(Boolean);

  const { error } = await supabaseAdmin
    .from('questions')
    .update({
      text: text.trim(),
      accepted_answers: acceptedAnswers,
    })
    .eq('id', id);

  if (error) {
    redirect('/admin?error=update');
  }

  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get('password') ?? '').trim();
  const adminPass = getAdminPassword();

  if (!adminPass) {
    redirect('/admin?error=1');
  }

  // Zahasujeme obe heslá pred porovnaním, aby mali vždy zhodnú dĺžku (64 znakov).
  // Týmto úplne skryjeme reálnu dĺžku hesla pred timing attackom.
  const expectedHash = createHash('sha256').update(adminPass).digest('hex');
  const providedHash = createHash('sha256').update(password).digest('hex');

  if (!timingSafeEqual(Buffer.from(expectedHash), Buffer.from(providedHash))) {
    redirect('/admin?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_access', providedHash, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/admin',
  });

  redirect('/admin');
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set('admin_access', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/admin',
    maxAge: 0,
  });

  redirect('/');
}

export async function createQuestion(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value ?? '';
  if (!(await verifyAdminToken(sessionToken))) {
    redirect('/admin?error=1');
  }

  const text = String(formData.get('text') ?? '').trim();
  const acceptedRaw = String(formData.get('accepted') ?? '').trim();

  if (!text || !acceptedRaw) {
    redirect('/admin?error=2');
  }

  const accepted = acceptedRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (accepted.length === 0) {
    redirect('/admin?error=2');
  }

  const { error } = await supabaseAdmin.from('questions').insert({
    text,
    accepted_answers: accepted,
  });

  if (error) {
    redirect('/admin?error=3');
  }

  revalidatePath('/', 'layout');
}
