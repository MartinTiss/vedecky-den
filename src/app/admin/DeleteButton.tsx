'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { deleteQuestion } from './actions';

export function DeleteButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = () => {
    startTransition(() => {
      const formData = new FormData();
      formData.append('id', String(id));
      deleteQuestion(formData);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full rounded-xl bg-rose-50 px-4 py-2 text-center text-sm font-bold text-rose-600 transition hover:bg-rose-100"
      >
        Vymazať
      </button>

      {mounted && showModal && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-all"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-rose-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-900">Vymazať otázku?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Naozaj chcete vymazať túto otázku? Tento krok sa nedá vrátiť späť.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowModal(false)} disabled={isPending} className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                Zrušiť
              </button>
              <button type="button" onClick={handleDelete} disabled={isPending} className="w-full rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto">
                {isPending ? 'Mažem...' : 'Áno, vymazať'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}