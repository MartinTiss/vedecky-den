import QuizContainer, { type PublicQuestion } from '@/components/QuizContainer';
import { supabase } from '@/lib/supabase';

async function loadQuestions(): Promise<PublicQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, text')
    .order('id', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as PublicQuestion[];
}

export default async function HomePage() {
  const questions = await loadQuestions();

  return (
    <main className="relative min-h-screen overflow-clip bg-amber-100 text-slate-900 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_85%_20%,_rgba(244,63,94,0.18),_transparent_30%),linear-gradient(180deg,_rgba(254,240,138,1),_rgba(254,215,170,1))]" />
      <div className="absolute left-[-9rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute right-[-7rem] top-[14rem] h-80 w-80 rounded-full bg-pink-400/20 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
        <div className="my-auto rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-xl shadow-amber-200/60 sm:p-6">
          <QuizContainer questions={questions} />
        </div>
      </section>
    </main>
  );
}
