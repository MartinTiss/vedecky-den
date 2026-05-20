'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export async function deleteQuestion(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value ?? '';
  if (!isAdminSession(sessionToken)) {
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
  redirect('/admin?success=deleted');
}

export async function updateQuestion(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value ?? '';
  if (!isAdminSession(sessionToken)) {
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

function isAdminSession(password?: string | null): boolean {
  const adminPassword = getAdminPassword();
  return Boolean(adminPassword && password && password === adminPassword);
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get('password') ?? '').trim();

  if (!isAdminSession(password)) {
    redirect('/admin?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_access', password, {
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
  if (!isAdminSession(sessionToken)) {
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

  redirect('/admin?success=1');
}
