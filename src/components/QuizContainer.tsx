'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPlayer, getPlayerProgress, submitAnswer } from '@/app/actions';

export type PublicQuestion = {
  id: number;
  text: string;
};

type StoredPlayer = {
  id: string;
  nickname: string;
};

type FeedbackState = {
  variant: 'correct' | 'wrong';
  title: string;
  message: string;
  correctAnswer?: string;
};

const STORAGE_KEY = 'vedecky-den-player';

export default function QuizContainer({ questions }: { questions: PublicQuestion[] }) {
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [nickname, setNickname] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<number, FeedbackState>>({});
  const [errorByQuestion, setErrorByQuestion] = useState<Record<number, string>>({});
  const [wrongByQuestion, setWrongByQuestion] = useState<Record<number, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as Partial<StoredPlayer>;
      if (typeof parsed.id === 'string') {
        setPlayer({ id: parsed.id, nickname: parsed.nickname ?? 'Hráč' });
        setNickname(parsed.nickname ?? '');
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!player) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    if (!player) return;

    let canceled = false;

    void (async () => {
      try {
        const progress = await getPlayerProgress(player.id);
        if (canceled) return;

        if ('error' in progress && progress.error === 'PLAYER_NOT_FOUND') {
          setPlayer(null);
          window.localStorage.removeItem(STORAGE_KEY);
          setFormError('Tvoj účet bol vymazaný z databázy. Prosím, zadaj prezývku znova.');
          return;
        }

        if ('correctQuestionIds' in progress && progress.correctQuestionIds) {
          const correctIds = progress.correctQuestionIds as number[];
          const restoredFeedback: Record<number, FeedbackState> = {};
          correctIds.forEach((questionId) => {
            restoredFeedback[questionId] = {
              variant: 'correct',
              title: 'Správna odpoveď',
              message: '',
            };
          });

          setFeedbackByQuestion((prev) => ({ ...prev, ...restoredFeedback }));
          setWrongByQuestion((prev) => ({ ...prev, ...Object.fromEntries(correctIds.map((id) => [id, false])) }));
          setScore(progress.score ?? 0);
        }
      } catch (error) {
        // Ignore restore errors to keep the UI usable offline.
      }
    })();

    return () => {
      canceled = true;
    };
  }, [player]);

  const hasQuestions = questions.length > 0;
  const answeredCount = useMemo(() => Object.keys(feedbackByQuestion).length, [feedbackByQuestion]);
  const isDone = hasQuestions && answeredCount >= questions.length;

  function handleCreatePlayer() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFormError('Zadaj prezývku, aby si mohol začať.');
      return;
    }
    
    if (trimmed.length > 15) {
      setFormError('Prezývka je príliš dlhá (max 15 znakov).');
      return;
    }

    startTransition(() => {
      setFormError(null);

      void (async () => {
        try {
          const id = await createPlayer(trimmed);
          setPlayer({ id, nickname: trimmed });
          setScore(0);
          setAnswers({});
          setFeedbackByQuestion({});
          setErrorByQuestion({});
          setWrongByQuestion({});
        } catch (error) {
          setFormError(error instanceof Error ? error.message : 'Nepodarilo sa vytvoriť hráča.');
        }
      })();
    });
  }

  function handleAnswerChange(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmitAnswer(questionId: number) {
    if (!player) return;
    if (feedbackByQuestion[questionId]) return;

    const trimmed = (answers[questionId] ?? '').trim();
    if (!trimmed) {
      setErrorByQuestion((prev) => ({ ...prev, [questionId]: 'Odpoveď nesmie byť prázdna.' }));
      return;
    }

    if (trimmed.length > 30) {
      setErrorByQuestion((prev) => ({ ...prev, [questionId]: 'Odpoveď je príliš dlhá (max 30 znakov).' }));
      return;
    }

    startTransition(() => {
      setPendingQuestionId(questionId);
      setErrorByQuestion((prev) => ({ ...prev, [questionId]: '' }));

      void (async () => {
        try {
          const result = await submitAnswer(player.id, questionId, trimmed);

          if ('error' in result && result.error) {
            if (result.error === 'PLAYER_NOT_FOUND') {
              setPlayer(null);
              window.localStorage.removeItem(STORAGE_KEY);
              setFormError('Tvoj účet bol vymazaný z databázy. Prosím, zadaj prezývku znova.');
              return;
            }
            setErrorByQuestion((prev) => ({ ...prev, [questionId]: result.error as string }));
            return;
          }

          if ('success' in result && result.success) {
            setFeedbackByQuestion((prev) => ({
              ...prev,
              [questionId]: {
                variant: 'correct',
                title: 'Výborne, správna odpoveď!',
                message: '',
              },
            }));
            setWrongByQuestion((prev) => ({ ...prev, [questionId]: false }));
            setScore((value) => value + 1);
          } else {
            // Wrong answer: show a small inline hint and allow another attempt.
            setWrongByQuestion((prev) => ({ ...prev, [questionId]: true }));
          }
        } catch (error) {
          setErrorByQuestion((prev) => ({ ...prev, [questionId]: error instanceof Error ? error.message : 'Nepodarilo sa odoslať odpoveď.' }));
        } finally {
          setPendingQuestionId(null);
        }
      })();
    });
  }

  return (
    <div className="space-y-6">
      {player ? (
        <div className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-amber-200/40 backdrop-blur-sm sm:top-6 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Hráč</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
              🧑‍🔬 {player.nickname}
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Skóre</p>
            <div className="flex items-center gap-1 text-3xl font-black text-amber-500 drop-shadow-sm"><span>{score}</span><span className="text-xl">⭐</span></div>
          </div>
        </div>
      ) : null}

      {!player ? (
        <div className="flex flex-col items-center justify-center gap-6 p-6 text-center sm:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">Školský kvíz</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">Vedecký deň 🚀</h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">Zadaj svoju prezývku a ukáž, čo vieš!</p>
          </div>
          <div className="w-full max-w-sm space-y-4">
            <label className="block text-left text-sm font-bold text-slate-700" htmlFor="nickname">
              Tvoja prezývka
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
          maxLength={15}
              placeholder="Napr. Einstein123"
              className="w-full rounded-2xl border-2 border-amber-200 bg-white px-5 py-4 text-lg font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleCreatePlayer}
              disabled={isPending}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-300 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? 'Vytváram...' : 'Začať kvíz'}
            </button>
            <Link href="/admin" className="block pt-2 text-center text-sm font-medium text-slate-400 transition hover:text-slate-500">
              Admin
            </Link>
          </div>
          {formError ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">{formError}</p> : null}
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {!hasQuestions ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-md">
              <div className="text-4xl">⏳</div>
              <h2 className="mt-4 text-2xl font-bold text-amber-900">Otázky ešte nie sú pripravené</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Nahraj otázky do tabuľky <span className="font-semibold text-amber-900">questions</span> a kvíz sa
                automaticky zobrazí.
              </p>
            </div>
          ) : null}
          {isDone ? (
            <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100 p-8 text-center shadow-lg">
              <div className="text-6xl animate-bounce">🎉</div>
              <h2 className="mt-6 text-3xl font-black text-emerald-900">Paráda! Kvíz je dokončený</h2>
              <p className="mt-4 text-lg font-medium text-emerald-800">
                Si super! Tvoje konečné skóre je <span className="rounded-lg bg-emerald-200 px-3 py-1 font-black text-emerald-900">{score} ⭐</span>
              </p>
              <p className="mt-2 text-sm text-emerald-600">Výsledky sme bezpečne uložili.</p>
            </div>
          ) : null}

          <div className="space-y-6 sm:space-y-8">
            {questions.map((question, index) => {
              const feedback = feedbackByQuestion[question.id];
              const errorMessage = errorByQuestion[question.id];
              const isWrong = wrongByQuestion[question.id];
              const isLocked = isPending || pendingQuestionId === question.id || Boolean(feedback);
              const feedbackStyle = feedback?.variant === 'correct'
                ? 'border-emerald-300 bg-emerald-50 shadow-emerald-100'
                : 'border-rose-300 bg-rose-50 shadow-rose-100';

              return (
                <div
                  key={question.id}
                  className="mx-auto w-full max-w-2xl space-y-5 rounded-3xl border-2 border-white/80 bg-white/80 p-5 shadow-lg shadow-amber-200/40 backdrop-blur-md sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-extrabold text-blue-600">
                      {index + 1}
                    </div>
                    <h3 className="pt-1 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{question.text}</h3>
                  </div>

                  {!feedback ? (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          id={`answer-${question.id}`}
                          type="text"
                          value={answers[question.id] ?? ''}
                          disabled={isLocked}
                          onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                          maxLength={30}
                          placeholder="Tvoja odpoveď..."
                          className="w-full flex-1 rounded-2xl border-2 border-amber-200 bg-white px-5 py-4 text-lg font-medium text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitAnswer(question.id)}
                          disabled={isLocked}
                          className="w-full whitespace-nowrap rounded-2xl bg-blue-500 px-8 py-4 text-lg font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-95 disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
                        >
                          {pendingQuestionId === question.id ? 'Overujem...' : 'Overiť'}
                        </button>
                      </div>
                      {isWrong ? <p className="flex items-center gap-2 text-sm font-bold text-rose-500 animate-pulse">❌ Ups, to nie je správne. Skús znova!</p> : null}
                      {errorMessage ? <p className="text-sm font-medium text-rose-500">{errorMessage}</p> : null}
                    </div>
                  ) : null}

                  {feedback ? (
                    <div className={`mt-4 flex items-center gap-4 rounded-2xl border-2 p-5 shadow-sm ${feedbackStyle}`}>
                      <div className="text-3xl">{feedback.variant === 'correct' ? '🎉' : '💡'}</div>
                      <div>
                        <h4 className={`text-xl font-bold ${feedback.variant === 'correct' ? 'text-emerald-800' : 'text-rose-800'}`}>{feedback.title}</h4>
                        {feedback.message ? (
                          <p className={`mt-1 text-sm font-medium ${feedback.variant === 'correct' ? 'text-emerald-700' : 'text-rose-700'}`}>{feedback.message}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
