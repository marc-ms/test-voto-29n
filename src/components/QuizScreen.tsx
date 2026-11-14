import React, { useState, useEffect } from 'react';
import {
  BlockMeta,
  LikertValue,
  Question,
  TandaNumber,
  UserAnswer,
} from '../types';
import { CARD, KICKER, LINK, LINK_MUTED } from './ui';

interface QuizScreenProps {
  tanda: TandaNumber;
  questions: Question[];
  blocks: BlockMeta[];
  currentIndex: number;
  answers: Record<string, UserAnswer>;
  onAnswer: (questionId: string, value: LikertValue | null, weight: 0 | 1 | 2) => void;
  onPrevQuestion: () => void;
  onExitToHome: () => void;
  onOpenHelp: () => void;
}

const LIKERT_OPTIONS: { value: LikertValue; label: string; badge: string }[] = [
  { value: 2, label: 'Totalmente a favor', badge: '+2' },
  { value: 1, label: 'Más bien a favor', badge: '+1' },
  { value: 0, label: 'Neutral / Depende', badge: '0' },
  { value: -1, label: 'Más bien en contra', badge: '−1' },
  { value: -2, label: 'Totalmente en contra', badge: '−2' },
];

interface PressClipBlockProps {
  stanceLabel: string;
  titular: string;
  fuente: string;
}

const PressClipBlock: React.FC<PressClipBlockProps> = ({
  stanceLabel,
  titular,
  fuente,
}) => (
  <aside className="bg-card border border-line rounded-[4px] p-4 flex flex-col gap-2.5">
    <div className="pb-2 border-b border-line">
      <span className="block text-[10px] font-sans font-semibold uppercase tracking-[0.08em] text-stone">
        Choque de posturas · Prensa
      </span>
      <span className="block text-xs font-sans font-semibold text-ink mt-0.5">
        {stanceLabel}
      </span>
    </div>
    <blockquote className="font-serif italic text-[15px] leading-[1.4] text-ink">
      «{titular}»
    </blockquote>
    <cite className="not-italic font-sans text-xs text-stone">
      — {fuente}
    </cite>
  </aside>
);

export const QuizScreen: React.FC<QuizScreenProps> = ({
  tanda,
  questions,
  blocks,
  currentIndex,
  answers,
  onAnswer,
  onPrevQuestion,
  onExitToHome,
  onOpenHelp,
}) => {
  const question = questions[currentIndex];
  const existingAnswer = question ? answers[question.id] : undefined;

  const [isDoubleWeight, setIsDoubleWeight] = useState<boolean>(
    existingAnswer?.weight === 2
  );
  const [showContext, setShowContext] = useState<boolean>(false);

  useEffect(() => {
    const saved = question ? answers[question.id] : undefined;
    setIsDoubleWeight(saved?.weight === 2);
    setShowContext(false);
  }, [currentIndex, question, answers]);

  if (!question) {
    return null;
  }

  const blockMeta = blocks.find((b) => b.id === question.bloque);
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (val: LikertValue) => {
    const weight: 1 | 2 = isDoubleWeight ? 2 : 1;
    onAnswer(question.id, val, weight);
  };

  const handleSkip = () => {
    onAnswer(question.id, null, 0);
  };

  return (
    <div className="flex flex-col gap-5 pb-14">
      {/* Navegación y progreso */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button type="button" onClick={onExitToHome} className={LINK_MUTED}>
            ← Inicio
          </button>
          <button type="button" onClick={onOpenHelp} className={LINK}>
            ¿Cómo funciona?
          </button>
        </div>

        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className={KICKER}>
            Tanda {tanda} · Pregunta {currentIndex + 1} de {questions.length}
          </span>
          <span className="text-xs text-stone tabular-nums">{progressPct} %</span>
        </div>
        <div className="w-full h-1 bg-track">
          <div
            className="h-full bg-ink transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Contenedor relativo para tarjeta central y recortes de prensa flotantes en escritorio */}
      <div className="relative">
        {question.debate_prensa && (
          <>
            <div className="hidden lg:block absolute top-0 right-[calc(100%+1.25rem)] xl:right-[calc(100%+2rem)] w-60 xl:w-72">
              <PressClipBlock
                stanceLabel="Argumento Izquierda / Progresista"
                titular={question.debate_prensa.izquierda.titular}
                fuente={question.debate_prensa.izquierda.fuente}
              />
            </div>

            <div className="hidden lg:block absolute top-0 left-[calc(100%+1.25rem)] xl:left-[calc(100%+2rem)] w-60 xl:w-72">
              <PressClipBlock
                stanceLabel="Argumento Derecha / Conservador"
                titular={question.debate_prensa.derecha.titular}
                fuente={question.debate_prensa.derecha.fuente}
              />
            </div>
          </>
        )}

        {/* Tarjeta de pregunta */}
        <article className={`${CARD} p-5 flex flex-col gap-5`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={KICKER}>
              {blockMeta ? blockMeta.nombre : question.bloque}
            </span>
            <span className="text-[11px] text-stone/70 tabular-nums">
              {question.id}
            </span>
          </div>

          <h2 className="font-serif text-[23px] leading-[1.3] font-semibold tracking-tight text-ink">
            {question.enunciado}
          </h2>

          {(question.contexto_opcional || question.debate_prensa) && (
            <div>
              <button
                type="button"
                onClick={() => setShowContext((prev) => !prev)}
                aria-expanded={showContext}
                className="text-sm font-medium text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink cursor-pointer text-left"
              >
                {showContext ? (
                  '− Ocultar contexto'
                ) : question.debate_prensa ? (
                  <>
                    + ¿Qué implica esto?
                    <span className="lg:hidden"> · Ver posturas en prensa</span>
                  </>
                ) : (
                  '+ ¿Qué implica esto?'
                )}
              </button>

              {showContext && (
                <div className="mt-3 flex flex-col gap-3">
                  {question.contexto_opcional && (
                    <p className="pl-3 border-l-2 border-ink text-sm text-stone leading-relaxed">
                      {question.contexto_opcional}
                    </p>
                  )}

                  {question.debate_prensa && (
                    <div className="grid grid-cols-1 gap-2.5 lg:hidden">
                      <PressClipBlock
                        stanceLabel="Argumento Izquierda / Progresista"
                        titular={question.debate_prensa.izquierda.titular}
                        fuente={question.debate_prensa.izquierda.fuente}
                      />
                      <PressClipBlock
                        stanceLabel="Argumento Derecha / Conservador"
                        titular={question.debate_prensa.derecha.titular}
                        fuente={question.debate_prensa.derecha.fuente}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Tema clave: casilla sobria */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isDoubleWeight}
          onClick={() => setIsDoubleWeight((prev) => !prev)}
          className={`w-full flex items-start gap-3 px-3.5 py-3 border rounded-[4px] text-left transition-colors cursor-pointer ${
            isDoubleWeight
              ? 'border-ink bg-cream'
              : 'border-line-strong bg-white hover:border-ink'
          }`}
        >
          <span
            className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${
              isDoubleWeight ? 'bg-ink border-ink' : 'bg-white border-ink'
            }`}
          >
            {isDoubleWeight && (
              <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                <path
                  d="M2.5 6.2 L5 8.6 L9.5 3.6"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
              </svg>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">
              Tema clave para mí (valora el doble)
            </span>
            <span className="block text-xs text-stone mt-0.5">
              {isDoubleWeight
                ? 'Esta pregunta contará el doble en tu resultado.'
                : 'Márcalo si este asunto es decisivo para tu voto.'}
            </span>
          </span>
        </button>

        {/* 5 opciones de respuesta */}
        <div className="flex flex-col gap-2">
          {LIKERT_OPTIONS.map((opt) => {
            const isSelected =
              existingAnswer !== undefined &&
              existingAnswer.weight > 0 &&
              existingAnswer.value === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption(opt.value)}
                aria-pressed={isSelected}
                className={`w-full py-3.5 px-4 border rounded-[4px] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-ink bg-cream'
                    : 'border-line-strong bg-white hover:border-ink hover:bg-cream'
                }`}
              >
                <span
                  className={`text-[15px] text-ink ${
                    isSelected ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-sm text-stone tabular-nums">{opt.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Pie: anterior y saltar */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-line">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={onPrevQuestion}
            className={`text-sm transition-colors ${
              currentIndex === 0
                ? 'text-line-strong cursor-not-allowed'
                : 'text-stone hover:text-ink cursor-pointer'
            }`}
          >
            ← Anterior
          </button>

          <button type="button" onClick={handleSkip} className={LINK_MUTED}>
            Saltar pregunta / No sé →
          </button>
        </div>
      </article>
      </div>
    </div>
  );
};
