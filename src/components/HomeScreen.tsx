import React, { useState } from 'react';
import {
  BlockId,
  PersistedState,
  QuestionnaireData,
  TandaNumber,
} from '../types';
import { BlockIcon } from './BlockIcon';
import { HowItWorksAccordion } from './HowItWorks';
import {
  Play,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';

interface HomeScreenProps {
  data: QuestionnaireData;
  persisted: PersistedState;
  onStartTanda: (tanda: TandaNumber, selectedBlocks: BlockId[]) => void;
  onContinueQuiz: () => void;
  onViewResults: () => void;
  onResetAll: () => void;
  onOpenHelp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  data,
  persisted,
  onStartTanda,
  onContinueQuiz,
  onViewResults,
  onResetAll,
  onOpenHelp,
}) => {
  const [selectedBlocks, setSelectedBlocks] = useState<BlockId[]>(
    persisted.selectedBlocks || []
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const activeFilterBlocks = selectedBlocks;
  const isAllBlocks = activeFilterBlocks.length === 0;

  const toggleBlock = (id: BlockId) => {
    setSelectedBlocks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectAllBlocks = () => setSelectedBlocks([]);

  // Calcular cuántas preguntas hay en la tanda activa según filtro
  const getQuestionsForTanda = (tanda: TandaNumber) =>
    data.preguntas.filter(
      (q) =>
        q.tanda === tanda &&
        (isAllBlocks || activeFilterBlocks.includes(q.bloque))
    );

  const tanda1Questions = getQuestionsForTanda(1);
  const tanda2Questions = getQuestionsForTanda(2);
  const tanda3Questions = getQuestionsForTanda(3);

  const totalSelectedQuestions =
    tanda1Questions.length + tanda2Questions.length + tanda3Questions.length;
  const pctTanda1 =
    totalSelectedQuestions > 0
      ? Math.round((tanda1Questions.length / totalSelectedQuestions) * 100)
      : 0;
  const pctTanda12 =
    totalSelectedQuestions > 0
      ? Math.round(
          ((tanda1Questions.length + tanda2Questions.length) /
            totalSelectedQuestions) *
            100
        )
      : 0;

  const answeredCount = Object.keys(persisted.answers).length;
  const completedCount = persisted.completedTandas.length;

  // Determinar si hay una tanda a medio hacer
  const currentTandaQuestions = data.preguntas.filter(
    (q) =>
      q.tanda === persisted.activeTanda &&
      (persisted.selectedBlocks.length === 0 ||
        persisted.selectedBlocks.includes(q.bloque))
  );
  const answeredInActiveTanda = currentTandaQuestions.filter(
    (q) => persisted.answers[q.id] !== undefined
  ).length;
  const hasInProgressTanda =
    answeredInActiveTanda > 0 &&
    answeredInActiveTanda < currentTandaQuestions.length;

  const nextTandaToStart: TandaNumber =
    !persisted.completedTandas.includes(1)
      ? 1
      : !persisted.completedTandas.includes(2)
      ? 2
      : 3;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Cabecera / Hero */}
      <header className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Congreso 29N · Illes Balears
          </span>
          <span className="text-xs text-slate-300 font-medium">
            v{data.metadata.version}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight leading-snug mb-2">
          Test de Afinidad Electoral Baleares 29N
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Compara tus posturas con los programas y declaraciones reales de las{' '}
          <strong className="text-white">8 candidaturas</strong> por Baleares en
          un sistema acumulativo de 3 tandas.
        </p>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo funciona?</span>
          </button>
          <span className="text-[11px] text-slate-300/80">
            4 claves rápidas
          </span>
        </div>
      </header>

      {/* Tarjeta de Estado en localStorage */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tu progreso guardado
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Llevas {completedCount}/3 tandas completadas
          </span>
        </div>

        {/* Indicadores de las 3 tandas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {([1, 2, 3] as TandaNumber[]).map((t) => {
            const isDone = persisted.completedTandas.includes(t);
            const isCurrent = persisted.activeTanda === t && hasInProgressTanda;
            return (
              <div
                key={t}
                className={`rounded-xl p-2.5 border text-center transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : isCurrent
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="text-xs font-bold">Tanda {t}</div>
                <div className="text-[11px] mt-0.5">
                  {isDone
                    ? 'Completada'
                    : isCurrent
                    ? `En curso (${answeredInActiveTanda}/${currentTandaQuestions.length})`
                    : t === 1
                    ? `Principal (${tanda1Questions.length})`
                    : t === 2
                    ? `Refuerzo (${tanda2Questions.length})`
                    : `Cierre (${tanda3Questions.length})`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de acción principales según el estado */}
        <div className="flex flex-col gap-2.5">
          {hasInProgressTanda && (
            <button
              onClick={onContinueQuiz}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Continuar Tanda {persisted.activeTanda} por la pregunta{' '}
              {Math.min(
                persisted.currentIndex + 1,
                currentTandaQuestions.length
              )}
            </button>
          )}

          {!hasInProgressTanda && completedCount < 3 && (
            <button
              onClick={() => onStartTanda(nextTandaToStart, selectedBlocks)}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {nextTandaToStart === 1
                ? `Iniciar Tanda 1 (${tanda1Questions.length} preguntas)`
                : nextTandaToStart === 2
                ? `Afianzar afinidad: Hacer Tanda 2 (+${tanda2Questions.length} preg.)`
                : `Test Exhaustivo: Hacer Tanda 3 (+${tanda3Questions.length} preg.)`}
            </button>
          )}

          {answeredCount > 0 && (
            <button
              onClick={onViewResults}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Ver resultados actuales ({answeredCount} resp.)
            </button>
          )}

          {(answeredCount > 0 || completedCount > 0) && (
            <div className="pt-1">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar test desde cero
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  <span className="text-xs text-rose-800 font-medium flex-1">
                    ¿Borrar todas tus respuestas guardadas?
                  </span>
                  <button
                    onClick={() => {
                      onResetAll();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Sí, borrar
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Acordeón informativo "¿Cómo funciona?" */}
      <HowItWorksAccordion />

      {/* Filtro Personalizado por Bloques Temáticos */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Modo por Bloques Temáticos
            </h2>
          </div>
          {!isAllBlocks && (
            <button
              onClick={selectAllBlocks}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Marcar todos (8)
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-3.5">
          {isAllBlocks
            ? 'Por defecto se evalúan los 8 bloques. Pulsa sobre los bloques si prefieres filtrar temas específicos:'
            : `Has seleccionado ${selectedBlocks.length} de 8 bloques temáticos:`}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {data.metadata.bloques.map((bloque) => {
            const isSelected =
              isAllBlocks || selectedBlocks.includes(bloque.id);
            const isExplicitlySelected = selectedBlocks.includes(bloque.id);

            return (
              <button
                key={bloque.id}
                type="button"
                onClick={() => toggleBlock(bloque.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isExplicitlySelected
                    ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                    : isAllBlocks
                    ? 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 opacity-65'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <BlockIcon iconName={bloque.icono} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold leading-tight truncate">
                    {bloque.nombre}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selector directo de Tandas */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <h2 className="text-sm font-bold text-slate-800 mb-1">
          Sistema de 3 Tandas Acumulativas
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Puedes hacer solo la Tanda 1 para un resultado sólido inicial ({pctTanda1}%
          del banco) o sumar las tandas 2 y 3 para alcanzar el 100 % de
          precisión.
        </p>
        <div className="flex flex-col gap-2">
          {([1, 2, 3] as TandaNumber[]).map((t) => {
            const questionsInT = getQuestionsForTanda(t);
            const isDone = persisted.completedTandas.includes(t);
            return (
              <div
                key={t}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Tanda {t}:{' '}
                      {t === 1
                        ? `Test Principal (${pctTanda1}%)`
                        : t === 2
                        ? `Consolidación (${pctTanda12}% acum.)`
                        : 'Test Exhaustivo (100%)'}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Hecha
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {questionsInT.length} preguntas seleccionadas
                  </p>
                </div>
                <button
                  onClick={() => onStartTanda(t, selectedBlocks)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
                >
                  {isDone ? 'Repetir' : 'Jugar'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Candidaturas evaluadas en Illes Balears */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-800">
            8 Candidaturas por Illes Balears
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.metadata.partidos.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 bg-slate-50/60"
            >
              <span
                className="w-3 h-8 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {p.siglas}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {p.candidato_baleares}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

