import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { createQuestion, loginAdmin, logoutAdmin, updateQuestion, verifyAdminToken } from './actions';
import { DeleteButton } from './DeleteButton';

async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_access')?.value;
  
  return await verifyAdminToken(sessionToken);
}

async function loadQuestions() {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id, text, accepted_answers')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return data ?? [];
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; edit?: string }>;
}) {
  const authed = await isAdminSession();
  const questions = authed ? await loadQuestions() : [];
  const resolvedParams = (await searchParams) ?? {};
  const error = resolvedParams.error;
  const parsedEditId = resolvedParams.edit ? parseInt(resolvedParams.edit, 10) : null;
  const editId = Number.isNaN(parsedEditId) ? null : parsedEditId;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-amber-50 px-4 py-8 sm:px-6 sm:py-10 text-slate-900 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_85%_20%,_rgba(244,63,94,0.18),_transparent_30%),linear-gradient(180deg,_rgba(254,240,138,1),_rgba(254,215,170,1))]" />
      <div className="absolute left-[-9rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute right-[-7rem] top-[14rem] h-80 w-80 rounded-full bg-pink-400/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-6 sm:space-y-8">

        {!authed ? (
          <div className="my-auto flex w-full items-center justify-center">
            <form action={loginAdmin} className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-amber-200/60 backdrop-blur-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">⚙️</div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">Vedecký deň</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Admin prihlásenie</h1>
              </div>
              <label className="block text-sm font-bold text-slate-700" htmlFor="password">
                Heslo
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full flex-1 rounded-2xl border-2 border-amber-200 bg-white px-5 py-4 text-lg font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Zadaj heslo"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-500 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-blue-600 active:scale-95 sm:w-auto"
                >
                  Vstúpiť
                </button>
              </div>
              {error ? <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">❌ Neplatné heslo.</p> : null}
              <Link
                href="/"
                className="mt-8 block text-center text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                &larr; Späť na hlavnú stránku
              </Link>
            </form>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-500">⚙️ Administrácia</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Správa otázok</h1>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                <Link href="/admin/analytics" className="rounded-2xl bg-blue-100 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-200 active:scale-95">
                  📊 Štatistiky
                </Link>
                <form action={logoutAdmin}>
                  <button type="submit" className="rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95">
                    Odhlásiť sa
                  </button>
                </form>
              </div>
            </header>

            <form key={questions.length} action={createQuestion} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm">
              <div className="border-b border-amber-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">✨ Nová otázka</h2>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700" htmlFor="text">
                    Znenie otázky
                  </label>
                  <textarea
                    id="text"
                    name="text"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-2xl border-2 border-amber-200 bg-white px-5 py-4 text-lg font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Napr.: Ako sa volá naša planéta?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700" htmlFor="accepted">
                    Akceptované odpovede
                  </label>
                  <input
                    id="accepted"
                    name="accepted"
                    type="text"
                    className="mt-2 w-full rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-base font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Zem, planéta Zem"
                    required
                  />
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Jednotlivé odpovede oddeľte čiarkou. Systém automaticky akceptuje odpovede bez ohľadu na veľké/malé písmená a diakritiku.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-600 active:scale-95 sm:w-auto"
                >
                  + Pridať otázku
                </button>
              </div>
              {error === '2' ? (
                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">Vyplňte text otázky aj odpovede.</div>
              ) : null}
              {error === '3' ? (
                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">Nastala chyba pri ukladaní otázky do databázy.</div>
              ) : null}
            </form>

            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-amber-200/60 backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-bold text-slate-900">📋 Zoznam uložených otázok</h2>
              {error === 'delete' ? <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">Nastala chyba pri mazaní otázky.</div> : null}
              {error === 'update' ? <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">Nastala chyba pri úprave otázky.</div> : null}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-8 text-center">
                    <p className="text-sm text-slate-500">Zatiaľ neexistujú žiadne otázky.</p>
                  </div>
                ) : (
                  questions.map((question) => {
                    if (editId === question.id) {
                      return (
                        <form action={updateQuestion} key={question.id} className="relative overflow-hidden rounded-2xl border border-blue-400 bg-blue-50/60 p-5 shadow-inner">
                          <input type="hidden" name="id" value={question.id} />
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Znenie otázky</label>
                              <textarea name="text" defaultValue={question.text} required rows={2} className="mt-2 w-full resize-none rounded-2xl border-2 border-blue-200 p-4 text-lg font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Akceptované odpovede</label>
                              <input type="text" name="accepted" defaultValue={(Array.isArray(question.accepted_answers) ? question.accepted_answers : []).join(', ')} required className="mt-2 w-full rounded-2xl border-2 border-blue-200 p-3 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                            </div>
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                              <button type="submit" className="w-full rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-600 active:scale-95 sm:w-auto">
                                Uložiť zmeny
                              </button>
                              <Link href="/admin" scroll={false} className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 sm:w-auto">
                                Zrušiť
                              </Link>
                            </div>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div key={question.id} className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md hover:shadow-blue-100">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                            {question.id}
                          </div>
                          <div className="flex flex-1 flex-col gap-4 pt-1 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-bold text-slate-900">{question.text}</p>
                              <div className="mt-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Akceptované odpovede</p>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(question.accepted_answers) ? question.accepted_answers : []).map((ans, idx) => (
                                    <span key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                                      {ans}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex shrink-0 flex-col gap-2 lg:mt-0 lg:w-28">
                              <Link href={`/admin?edit=${question.id}`} scroll={false} className="rounded-xl bg-blue-50 px-4 py-2 text-center text-sm font-bold text-blue-600 transition hover:bg-blue-100">
                                Upraviť
                              </Link>
                              <DeleteButton id={question.id} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
