import React, { useState, useEffect } from 'react';
import {
  BlockMeta,
  LikertValue,
  Question,
  TandaNumber,
  UserAnswer,
} from '../types';
import { BlockIcon } from './BlockIcon';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  HelpCircle,
  Home,
  Info,
  SkipForward,
} from 'lucide-react';

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

const LIKERT_OPTIONS: {
  value: LikertValue;
  label: string;
  sublabel: string;
  activeClass: string;
  baseClass: string;
  badgeText: string;
}[] = [
  {
    value: 2,
    label: 'Totalmente a favor',
    sublabel: 'De acuerdo sin matices (+2)',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    baseClass:
      'bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950',
    badgeText: '+2',
  },
  {
    value: 1,
    label: 'Más bien a favor',
    sublabel: 'De acuerdo en líneas generales (+1)',
    activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
    baseClass:
      'bg-teal-50/50 hover:bg-teal-100/70 border-teal-200 text-teal-950',
    badgeText: '+1',
  },
  {
    value: 0,
    label: 'Neutral / Depende',
    sublabel: 'Postura intermedia o con condiciones (0)',
    activeClass: 'bg-slate-700 text-white border-slate-700 shadow-md',
    baseClass:
      'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800',
    badgeText: '0',
  },
  {
    value: -1,
    label: 'Más bien en contra',
    sublabel: 'En desacuerdo en líneas generales (-1)',
    activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md',
    baseClass:
      'bg-amber-50/50 hover:bg-amber-100/70 border-amber-200 text-amber-950',
    badgeText: '-1',
  },
  {
    value: -2,
    label: 'Totalmente en contra',
    sublabel: 'Rechazo frontal a la propuesta (-2)',
    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md',
    baseClass:
      'bg-rose-50/60 hover:bg-rose-100/80 border-rose-200 text-rose-950',
    badgeText: '-2',
  },
];

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
    <div className="flex flex-col gap-4 pb-10">
      {/* Barra superior de navegación y progreso */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <button
            type="button"
            onClick={onExitToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Inicio
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1 rounded-full transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo funciona?</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Tanda {tanda} · {currentIndex + 1} de {questions.length}
          </span>

          <span className="text-xs font-bold text-slate-600">
            {progressPct}%
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tarjeta de Pregunta */}
      <article className="bg-white rounded-3xl p-5 shadow-md border border-slate-200/90 flex flex-col gap-4">
        {/* Badge del bloque temático */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            {blockMeta && (
              <BlockIcon
                iconName={blockMeta.icono}
                className="w-3.5 h-3.5 text-indigo-600"
              />
            )}
            <span>{blockMeta ? blockMeta.nombre : question.bloque}</span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            #{question.id}
          </span>
        </div>

        {/* Enunciado de la pregunta */}
        <h2 className="text-lg font-bold text-slate-900 leading-snug">
          {question.enunciado}
        </h2>

        {/* Botón desplegable "¿Qué implica esto?" */}
        {question.contexto_opcional && (
          <div>
            <button
              type="button"
              onClick={() => setShowContext((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>¿Qué implica esto?</span>
              {showContext ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showContext && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                {question.contexto_opcional}
              </div>
            )}
          </div>
        )}

        {/* Switch "Tema clave para mí (valora el doble)" */}
        <button
          type="button"
          onClick={() => setIsDoubleWeight((prev) => !prev)}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
            isDoubleWeight
              ? 'bg-orange-50 border-orange-400 text-orange-950 ring-1 ring-orange-400'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5 text-left">
            <div
              className={`p-1.5 rounded-lg ${
                isDoubleWeight
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">
                🔥 Tema clave para mí (valora el doble)
              </div>
              <div className="text-[11px] opacity-75">
                {isDoubleWeight
                  ? 'Activado: esta pregunta pesará x2 en tu afinidad'
                  : 'Pulsa si este asunto es prioritario para tu voto'}
              </div>
            </div>
          </div>

          <div
            className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
              isDoubleWeight ? 'bg-orange-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isDoubleWeight ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* 5 Botones grandes táctiles */}
        <div className="flex flex-col gap-2.5 pt-1">
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
                className={`w-full py-3.5 px-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition active:scale-[0.98] cursor-pointer ${
                  isSelected ? opt.activeClass : opt.baseClass
                }`}
              >
                <div>
                  <div className="text-sm font-bold leading-tight">
                    {opt.label}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? 'text-white/85' : ' opacity-70'
                    }`}
                  >
                    {opt.sublabel}
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white/80 text-slate-600 border border-black/5'
                  }`}
                >
                  {opt.badgeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pie de tarjeta: Pregunta anterior y Saltar pregunta */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={onPrevQuestion}
            className={`inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Pregunta anterior
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          >
            <span>Saltar pregunta / No sé</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    </div>
  );
};

