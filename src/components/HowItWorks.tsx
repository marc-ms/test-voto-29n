import React, { useEffect, useState } from 'react';
import { BTN_PRIMARY, CARD, KICKER } from './ui';

const POINTS: { title: string; body: React.ReactNode }[] = [
  {
    title: '3 Tandas acumulativas (Sin repetir preguntas)',
    body: (
      <p>
        El test completo se divide en 3 tandas de unas 20-30 preguntas. Con
        hacer la Tanda 1 (4 min) ya obtienes tu afinidad. Si luego quieres
        afinar más el resultado, puedes jugar las Tandas 2 y 3 sumando nuevas
        preguntas sin repetir ninguna.
      </p>
    ),
  },
  {
    title: '"Neutral" vs "Saltar pregunta"',
    body: (
      <ul className="space-y-1.5">
        <li className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-stone">
          Pulsar "Neutral / Depende" significa que prefieres una postura
          moderada o intermedia (suma puntos con partidos moderados y resta con
          los extremos).
        </li>
        <li className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-stone">
          Pulsar "Saltar pregunta / No sé" ignora por completo esa pregunta para
          que no afecte a tu porcentaje.
        </li>
      </ul>
    ),
  },
  {
    title: 'Tema clave para mí (Doble valor)',
    body: (
      <p>
        Si una pregunta trata un asunto innegociable para tu voto (ej. vivienda
        o turismo), activa la casilla "Tema clave". Esa pregunta valdrá el
        doble (x2) en tu nota final.
      </p>
    ),
  },
  {
    title: 'Datos reales y auditables (Baleares 29N)',
    body: (
      <p>
        Las posturas de los 8 partidos que se presentan en Illes Balears se
        extraen de sus programas y compromisos oficiales. En la pantalla de
        resultados podrás desplegar pregunta a pregunta la cita exacta y la
        fuente de cada partido.
      </p>
    ),
  },
];

export const HowItWorksCards: React.FC = () => {
  return (
    <ol className="divide-y divide-line">
      {POINTS.map((point, idx) => (
        <li key={point.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <span className="font-serif text-2xl font-bold text-ink leading-none w-5 shrink-0 tabular-nums">
            {idx + 1}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-base font-semibold text-ink leading-snug tracking-tight">
              {point.title}
            </h3>
            <div className="text-sm text-stone leading-relaxed mt-1">
              {point.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

export const HowItWorksAccordion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={CARD}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left cursor-pointer group"
      >
        <div className="min-w-0">
          <span className={KICKER}>Guía rápida</span>
          <h2 className="font-serif text-xl font-semibold tracking-tight text-ink leading-snug mt-0.5 group-hover:underline underline-offset-4 decoration-line-strong">
            ¿Cómo funciona el test?
          </h2>
        </div>
        <span className="text-xl text-stone leading-none shrink-0 w-5 text-center">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-4 border-t border-line">
          <HowItWorksCards />
        </div>
      )}
    </section>
  );
};

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/45 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-modal-title"
    >
      <div
        className="bg-card w-full max-w-md border border-line sm:rounded-[4px] max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line flex items-baseline justify-between gap-3 shrink-0">
          <div>
            <span className={KICKER}>Guía rápida</span>
            <h2
              id="how-it-works-modal-title"
              className="font-serif text-xl font-semibold tracking-tight text-ink mt-0.5"
            >
              ¿Cómo funciona el test?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="text-sm text-stone hover:text-ink underline underline-offset-4 decoration-line-strong cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto flex-1">
          <HowItWorksCards />
        </div>

        <div className="p-4 border-t border-line shrink-0">
          <button type="button" onClick={onClose} className={BTN_PRIMARY}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
