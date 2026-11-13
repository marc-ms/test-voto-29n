import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  HelpCircle,
  Layers,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';

export const HowItWorksCards: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Punto 1 */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
            1. 3 Tandas acumulativas (Sin repetir preguntas)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            El test completo se divide en 3 tandas de unas 20-30 preguntas. Con
            hacer la Tanda 1 (4 min) ya obtienes tu afinidad. Si luego quieres
            afinar más el resultado, puedes jugar las Tandas 2 y 3 sumando
            nuevas preguntas sin repetir ninguna.
          </p>
        </div>
      </div>

      {/* Punto 2 */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-200/80 text-slate-700 shrink-0 mt-0.5">
          <Scale className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
            2. "Neutral" vs "Saltar pregunta"
          </h3>
          <ul className="text-xs text-slate-600 leading-relaxed mt-1 space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-slate-500">•</span>
              <span>
                Pulsar "Neutral / Depende" significa que prefieres una postura
                moderada o intermedia (suma puntos con partidos moderados y
                resta con los extremos).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-slate-500">•</span>
              <span>
                Pulsar "Saltar pregunta / No sé" ignora por completo esa
                pregunta para que no afecte a tu porcentaje.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Punto 3 */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-orange-100 text-orange-600 shrink-0 mt-0.5">
          <Flame className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
            3. Tema clave para mí (Doble valor)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Si una pregunta trata un asunto innegociable para tu voto (ej.
            vivienda o turismo), activa la casilla "Tema clave". Esa pregunta
            valdrá el doble (x2) en tu nota final.
          </p>
        </div>
      </div>

      {/* Punto 4 */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
            4. Datos reales y auditables (Baleares 29N)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mt-1">
            Las posturas de los 8 partidos que se presentan en Illes Balears se
            extraen de sus programas y compromisos oficiales. En la pantalla de
            resultados podrás desplegar pregunta a pregunta la cita exacta y la
            fuente de cada partido.
          </p>
        </div>
      </div>
    </div>
  );
};

export const HowItWorksAccordion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 leading-tight">
              ¿Cómo funciona el test?
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Tandas, Neutral vs. Saltar, Tema clave y fuentes reales
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 shrink-0">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
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
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-modal-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2
              id="how-it-works-modal-title"
              className="text-base font-extrabold text-slate-900"
            >
              ¿Cómo funciona el test?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <HowItWorksCards />
        </div>

        <div className="p-4 pt-3 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

