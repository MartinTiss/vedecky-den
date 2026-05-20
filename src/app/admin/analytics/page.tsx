import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

async function isAdminSession(): Promise<boolean> {
  const adminToken = process.env.ADMIN_PASSWORD;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value;
  return Boolean(adminToken && sessionToken && sessionToken === adminToken);
}

type AnswerRow = {
  question_id: number;
  is_correct: boolean;
  player_id: string;
};

type PlayerRow = {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
};

type QuestionRow = {
  id: number;
  text: string;
};

async function loadAnalytics() {
  const { data: answers } = await supabaseAdmin.from('answers').select('player_id, question_id, is_correct');
  const { data: questions } = await supabaseAdmin.from('questions').select('id, text').order('id', { ascending: true });
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, nickname, score, created_at')
    .order('score', { ascending: false });

  return {
    answers: (answers ?? []) as AnswerRow[],
    questions: (questions ?? []) as QuestionRow[],
    players: (players ?? []) as PlayerRow[],
  };
}

export default async function AnalyticsPage() {
  if (!(await isAdminSession())) {
    return (
      <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-amber-50 px-6 py-10 text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_85%_20%,_rgba(244,63,94,0.18),_transparent_30%),linear-gradient(180deg,_rgba(254,240,138,1),_rgba(254,215,170,1))]" />
        <div className="relative flex w-full items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl shadow-amber-200/60 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">🔒</div>
            <h1 className="text-2xl font-semibold text-slate-900">Prístup zamietnutý</h1>
            <p className="mt-3 text-sm text-slate-600">Pre zobrazenie štatistík sa najprv prihlás v admin sekcii.</p>
            <Link href="/admin" className="mt-6 inline-block w-full rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-600 active:scale-95">
              Prejsť na prihlásenie
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { answers, questions, players } = await loadAnalytics();

  const statsByQuestion = new Map<number, { total: number; correct: number }>();
  for (const answer of answers) {
    const current = statsByQuestion.get(answer.question_id) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    statsByQuestion.set(answer.question_id, current);
  }

  const statsByPlayer = new Map<string, { total: number; correct: number }>();
  for (const answer of answers) {
    const current = statsByPlayer.get(answer.player_id) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    statsByPlayer.set(answer.player_id, current);
  }

  // Sort players: primary by score (desc), secondary by success rate (desc)
  players.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    const statsA = statsByPlayer.get(a.id) ?? { total: 0, correct: 0 };
    const rateA = statsA.total > 0 ? statsA.correct / statsA.total : 0;

    const statsB = statsByPlayer.get(b.id) ?? { total: 0, correct: 0 };
    const rateB = statsB.total > 0 ? statsB.correct / statsB.total : 0;

    return rateB - rateA;
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-amber-50 px-4 py-8 sm:px-6 sm:py-10 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_85%_20%,_rgba(244,63,94,0.18),_transparent_30%),linear-gradient(180deg,_rgba(254,240,138,1),_rgba(254,215,170,1))]" />
      <div className="absolute left-[-9rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute right-[-7rem] top-[14rem] h-80 w-80 rounded-full bg-pink-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-500">📊 Prehľad</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Štatistiky kvízu</h1>
          </div>
          <Link href="/admin" className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95">
            &larr; Späť na otázky
          </Link>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-900">📈 Štatistika odpovedí</h2>
          <div className="mt-4 space-y-4">
            {questions.length === 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-8 text-center">
                <p className="text-sm text-slate-500">Zatiaľ bez otázok.</p>
              </div>
            ) : (
              questions.map((question) => {
                const stats = statsByQuestion.get(question.id) ?? { total: 0, correct: 0 };
                const ratio = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;

                return (
                  <div key={question.id} className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 transition hover:border-blue-300 hover:shadow-md hover:shadow-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        #{question.id}
                      </div>
                      <div className="pt-1">
                        <p className="text-lg font-medium text-slate-900">{question.text}</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          Celkovo pokusov: <span className="text-slate-900">{stats.total}</span> <span className="mx-2 text-slate-300">|</span> Úspešne uhádnuté: <span className="text-emerald-600">{stats.correct}</span> <span className="mx-2 text-slate-300">|</span> Úspešnosť: <span className="text-blue-600">{ratio}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-900">🏆 Rebríček hráčov</h2>
          <div className="mt-4 space-y-3">
            {players.length === 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-8 text-center">
                <p className="text-sm text-slate-500">Zatiaľ bez hráčov.</p>
              </div>
            ) : (
              players.map((player, index) => {
                const isTop3 = index < 3;
                const medals = ['🥇', '🥈', '🥉'];

                const playerStats = statsByPlayer.get(player.id) ?? { total: 0, correct: 0 };
                const successRate = playerStats.total > 0 ? Math.round((playerStats.correct / playerStats.total) * 100) : 0;
                
                return (
                <div key={player.id} className={`flex items-center justify-between rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isTop3 ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-white shadow-amber-100' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${isTop3 ? 'bg-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                      {isTop3 ? medals[index] : index + 1}
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{player.nickname}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Skóre</p>
                    <p className="text-2xl font-black text-blue-600">{player.score}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Úspešnosť: <span className="font-bold text-slate-600">{successRate}%</span> ({playerStats.correct}/{playerStats.total})
                    </p>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
