'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Vytvorí nového hráča v databáze.
 */
export async function createPlayer(nickname: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('players')
    .insert({ nickname, score: 0 })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createPlayer error:', error);
    throw new Error('Nepodarilo sa vytvoriť hráča v databáze.');
  }
  return data.id;
}

/**
 * Získa aktuálny postup hráča (skóre a správne zodpovedané otázky).
 */
export async function getPlayerProgress(playerId: string) {
  const { data: player, error: playerError } = await supabaseAdmin
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    throw new Error('Hráč nebol nájdený.');
  }

  const { data: answers, error: answersError } = await supabaseAdmin
    .from('answers')
    .select('question_id')
    .eq('player_id', playerId)
    .eq('is_correct', true);

  if (answersError) {
    throw new Error('Nepodarilo sa načítať postup.');
  }

  return {
    score: player.score,
    correctQuestionIds: answers.map((a) => a.question_id),
  };
}

/**
 * Normalizuje text: prevedie na malé písmená a odstráni diakritiku.
 */
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Spracuje odpoveď od hráča, skontroluje jej správnosť a aktualizuje skóre.
 */
export async function submitAnswer(playerId: string, questionId: number, answer: string) {
  const { data: question, error: questionError } = await supabaseAdmin
    .from('questions')
    .select('accepted_answers')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    throw new Error('Otázka nebola nájdená.');
  }

  const acceptedAnswers = question.accepted_answers as string[];
  const normalizedStudentAnswer = normalizeString(answer);

  const isCorrect = acceptedAnswers.some((correctAnswer) => normalizeString(correctAnswer) === normalizedStudentAnswer);

  // Zaznamená pokus o odpoveď do databázy
  await supabaseAdmin.from('answers').insert({ player_id: playerId, question_id: questionId, answer_text: answer, is_correct: isCorrect });

  if (isCorrect) {
    // Pri správnej odpovedi načíta aktuálne skóre a zvýši ho o 1
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('score')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabaseAdmin.from('players').update({ score: player.score + 1 }).eq('id', playerId);
    }

    revalidatePath('/admin/analytics');
  }

  return { success: isCorrect };
}