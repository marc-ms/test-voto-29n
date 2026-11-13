import React, { useState } from 'react';
import {
  BlockId,
  PersistedState,
  QuestionnaireData,
  TandaNumber,
} from '../types';
import { HowItWorksAccordion } from './HowItWorks';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SMALL,
  CARD,
  KICKER,
  LINK,
  SECTION_TITLE,
} from './ui';

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

  // Calcular cuántas preguntas hay en cada tanda según filtro
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

  const tandaLabel = (t: TandaNumber) =>
    t === 1
      ? `Test principal · ${pctTanda1} % del banco`
      : t === 2
      ? `Consolidación · ${pctTanda12} % acumulado`
      : 'Test exhaustivo · 100 %';

  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* Cabecera editorial */}
      <header className="pt-2 pb-6 border-b border-ink">
        <div className="flex items-baseline justify-between gap-3">
          <span className={KICKER}>Elecciones Generales · 29N · Illes Balears</span>
          <span className="text-[11px] text-stone tabular-nums">
            v{data.metadata.version}
          </span>
        </div>
        <h1 className="font-serif text-[34px] leading-[1.08] font-bold tracking-tight text-ink mt-4">
          Test de afinidad electoral
        </h1>
        <p className="text-[15px] text-stone leading-relaxed mt-3">
          Compara tus posturas con los programas y compromisos de las{' '}
          <span className="text-ink font-medium">8 candidaturas</span> al
          Congreso por Baleares, en un sistema acumulativo de tres tandas.
        </p>
        <button type="button" onClick={onOpenHelp} className={`${LINK} mt-4`}>
          ¿Cómo funciona?
        </button>
      </header>

      {/* Estado guardado */}
      <section className={`${CARD} p-5`}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <span className={KICKER}>Tu progreso</span>
          <span className="text-xs text-stone">
            {completedCount}/3 tandas completadas
          </span>
        </div>

        <div className="grid grid-cols-3 border border-line divide-x divide-line rounded-[4px] mb-5">
          {([1, 2, 3] as TandaNumber[]).map((t) => {
            const isDone = persisted.completedTandas.includes(t);
            const isCurrent = persisted.activeTanda === t && hasInProgressTanda;
            const count =
              t === 1
                ? tanda1Questions.length
                : t === 2
                ? tanda2Questions.length
                : tanda3Questions.length;
            return (
              <div
                key={t}
                className={`px-2 py-3 text-center ${
                  isCurrent ? 'bg-cream' : ''
                }`}
              >
                <div className="font-serif text-base font-semibold text-ink">
                  Tanda {t}
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    isDone || isCurrent ? 'text-ink font-medium' : 'text-stone'
                  }`}
                >
                  {isDone
                    ? 'Completada'
                    : isCurrent
                    ? `En curso ${answeredInActiveTanda}/${currentTandaQuestions.length}`
                    : `${count} preguntas`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          {hasInProgressTanda && (
            <button type="button" onClick={onContinueQuiz} className={BTN_PRIMARY}>
              Continuar la tanda {persisted.activeTanda} por la pregunta{' '}
              {Math.min(persisted.currentIndex + 1, currentTandaQuestions.length)}
            </button>
          )}

          {!hasInProgressTanda && completedCount < 3 && (
            <button
              type="button"
              onClick={() => onStartTanda(nextTandaToStart, selectedBlocks)}
              className={BTN_PRIMARY}
            >
              {nextTandaToStart === 1
                ? `Comenzar la tanda 1 · ${tanda1Questions.length} preguntas`
                : nextTandaToStart === 2
                ? `Siguiente tanda: tanda 2 · +${tanda2Questions.length} preguntas`
                : `Siguiente tanda: tanda 3 · +${tanda3Questions.length} preguntas`}
            </button>
          )}

          {answeredCount > 0 && (
            <button type="button" onClick={onViewResults} className={BTN_SECONDARY}>
              Ver resultados actuales ({answeredCount} respuestas)
            </button>
          )}

          {(answeredCount > 0 || completedCount > 0) && (
            <div className="pt-2">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full text-center text-xs text-stone underline underline-offset-4 decoration-line-strong hover:text-ink hover:decoration-ink transition-colors cursor-pointer"
                >
                  Reiniciar el test desde cero
                </button>
              ) : (
                <div className="bg-mist p-3.5 rounded-[4px] flex flex-col gap-3">
                  <span className="text-sm text-ink">
                    ¿Borrar todas tus respuestas guardadas?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetAll();
                        setConfirmReset(false);
                      }}
                      className="flex-1 py-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold rounded-[4px] transition-colors cursor-pointer"
                    >
                      Sí, borrar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2 bg-white border border-line-strong text-ink text-xs font-semibold rounded-[4px] hover:border-ink transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <HowItWorksAccordion />

      {/* Filtro por bloques temáticos */}
      <section className={`${CARD} p-5`}>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 className={SECTION_TITLE}>Bloques temáticos</h2>
          {!isAllBlocks && (
            <button
              type="button"
              onClick={selectAllBlocks}
              className="text-xs font-medium text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink cursor-pointer"
            >
              Marcar los 8
            </button>
          )}
        </div>
        <p className="text-sm text-stone mb-4 leading-relaxed">
          {isAllBlocks
            ? 'Por defecto se evalúan los 8 bloques. Selecciona alguno si prefieres responder solo sobre temas concretos.'
            : `Has seleccionado ${selectedBlocks.length} de 8 bloques.`}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {data.metadata.bloques.map((bloque) => {
            const isExplicitlySelected = selectedBlocks.includes(bloque.id);
            const isDimmed = !isAllBlocks && !isExplicitlySelected;

            return (
              <button
                key={bloque.id}
                type="button"
                onClick={() => toggleBlock(bloque.id)}
                aria-pressed={isExplicitlySelected}
                className={`flex items-start gap-2.5 px-3 py-2.5 border rounded-[4px] text-left transition-colors cursor-pointer ${
                  isExplicitlySelected
                    ? 'border-ink bg-cream'
                    : 'border-line-strong bg-white hover:border-ink'
                }`}
              >
                <span
                  className={`mt-[3px] w-3 h-3 border shrink-0 ${
                    isExplicitlySelected
                      ? 'bg-ink border-ink'
                      : 'border-line-strong bg-white'
                  }`}
                />
                <span
                  className={`text-xs leading-snug ${
                    isDimmed ? 'text-stone' : 'text-ink font-medium'
                  }`}
                >
                  {bloque.nombre}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selector directo de tandas */}
      <section className={`${CARD} p-5`}>
        <h2 className={SECTION_TITLE}>Tres tandas acumulativas</h2>
        <p className="text-sm text-stone mt-1 mb-3 leading-relaxed">
          La tanda 1 ya ofrece un resultado sólido ({pctTanda1} % del banco).
          Las tandas 2 y 3 añaden preguntas nuevas hasta cubrir el 100 %.
        </p>
        <div className="divide-y divide-line border-t border-line">
          {([1, 2, 3] as TandaNumber[]).map((t) => {
            const questionsInT = getQuestionsForTanda(t);
            const isDone = persisted.completedTandas.includes(t);
            return (
              <div key={t} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-base font-semibold text-ink">
                      Tanda {t}
                    </span>
                    {isDone && (
                      <span className="text-[11px] text-stone">· hecha</span>
                    )}
                  </div>
                  <p className="text-xs text-stone mt-0.5">
                    {tandaLabel(t)} · {questionsInT.length} preguntas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartTanda(t, selectedBlocks)}
                  className={BTN_SMALL}
                >
                  {isDone ? 'Repetir' : 'Jugar'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Candidaturas */}
      <section className={`${CARD} p-5`}>
        <h2 className={SECTION_TITLE}>Las 8 candidaturas</h2>
        <p className="text-sm text-stone mt-1 mb-3">
          Cabezas de lista al Congreso por Illes Balears.
        </p>
        <div className="divide-y divide-line border-t border-line">
          {data.metadata.partidos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5">
              <span
                className="w-2.5 h-2.5 shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-serif text-[15px] font-semibold text-ink min-w-0 truncate">
                {p.siglas}
              </span>
              <span className="text-xs text-stone ml-auto text-right truncate">
                {p.candidato_baleares}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
