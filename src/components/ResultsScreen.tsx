import React, { useState } from 'react';
import {
  AffinityReport,
  BlockId,
  BlockMeta,
  PartyResult,
  QuestionnaireData,
  TandaNumber,
  UserAnswer,
} from '../types';
import { AuditAccordion } from './AuditAccordion';
import { PoliticalCompass } from './PoliticalCompass';
import {
  BTN_PRIMARY,
  CARD,
  KICKER,
  LINK,
  LINK_MUTED,
  SECTION_TITLE,
} from './ui';

function getPartyBlockHighlights(
  item: PartyResult,
  bloques: BlockMeta[]
): { closest: BlockMeta[]; farthest: BlockMeta } | null {
  const evaluated = bloques
    .map((b, idx) => ({
      block: b,
      score: item.blockScores[b.id],
      idx,
    }))
    .filter((entry) => entry.score && entry.score.answeredQuestionsCount > 0);

  if (evaluated.length < 2) return null;

  const sorted = [...evaluated].sort((a, b) => {
    if (b.score.affinityPercentage !== a.score.affinityPercentage) {
      return b.score.affinityPercentage - a.score.affinityPercentage;
    }
    if (b.score.definedPositionsCount !== a.score.definedPositionsCount) {
      return b.score.definedPositionsCount - a.score.definedPositionsCount;
    }
    return a.idx - b.idx;
  });

  const highest = sorted[0];
  const farthest = sorted[sorted.length - 1];

  if (highest.score.affinityPercentage <= farthest.score.affinityPercentage) {
    return null;
  }

  const candidates = sorted.slice(0, -1);
  const closest =
    candidates.length >= 2 &&
    candidates[1].score.affinityPercentage > farthest.score.affinityPercentage
      ? [candidates[0].block, candidates[1].block]
      : [candidates[0].block];

  return {
    closest,
    farthest: farthest.block,
  };
}

interface ResultsScreenProps {
  data: QuestionnaireData;
  report: AffinityReport;
  answers: Record<string, UserAnswer>;
  completedTandas: TandaNumber[];
  selectedBlocks: BlockId[];
  onStartNextTanda: (tanda: TandaNumber) => void;
  onGoHome: () => void;
  onResetAll: () => void;
  onOpenHelp: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  data,
  report,
  answers,
  completedTandas,
  selectedBlocks,
  onStartNextTanda,
  onGoHome,
  onResetAll,
  onOpenHelp,
}) => {
  const [expandedBlock, setExpandedBlock] = useState<BlockId | null>(null);

  const topWinner = report.rankings[0];
  const secondWinner = report.rankings[1];
  const topGap =
    topWinner && secondWinner
      ? Math.round(
          (topWinner.finalPercentage - secondWinner.finalPercentage) * 10
        ) / 10
      : null;

  const nextTanda: TandaNumber | null = !completedTandas.includes(1)
    ? 1
    : !completedTandas.includes(2)
    ? 2
    : !completedTandas.includes(3)
    ? 3
    : null;

  const nextTandaQuestionsCount = nextTanda
    ? data.preguntas.filter(
        (q) =>
          q.tanda === nextTanda &&
          (selectedBlocks.length === 0 || selectedBlocks.includes(q.bloque))
      ).length
    : 0;

  const hasTechnicalTie =
    topGap !== null &&
    report.totalAnsweredQuestions > 0 &&
    topGap < 4 &&
    nextTanda !== null &&
    nextTandaQuestionsCount > 0;

  const relevantQuestions = data.preguntas.filter(
    (q) => selectedBlocks.length === 0 || selectedBlocks.includes(q.bloque)
  );
  const coveredQuestionsCount = relevantQuestions.filter(
    (q) => completedTandas.includes(q.tanda) || answers[q.id] !== undefined
  ).length;
  const precisionPct =
    relevantQuestions.length > 0
      ? Math.min(
          100,
          Math.round((coveredQuestionsCount / relevantQuestions.length) * 100)
        )
      : 0;

  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* Navegación */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <button type="button" onClick={onGoHome} className={LINK_MUTED}>
          ← Inicio
        </button>
        <button type="button" onClick={onOpenHelp} className={LINK}>
          ¿Cómo funciona?
        </button>
      </div>

      {/* Resultado principal */}
      {topWinner && (
        <section className="border-t-2 border-ink pt-4">
          <span className={KICKER}>Tu mayor afinidad</span>
          <div className="flex items-start justify-between gap-4 mt-3">
            <div className="min-w-0">
              <h1
                className="font-serif text-[28px] leading-[1.1] font-bold tracking-tight"
                style={{ color: topWinner.party.color }}
              >
                {topWinner.party.nombre}
              </h1>
              <p className="text-sm text-stone mt-2">
                Cabeza de lista por Baleares:{' '}
                <span className="text-ink font-medium">
                  {topWinner.party.candidato_baleares}
                </span>
              </p>
            </div>
            <span
              className="font-serif text-[44px] leading-none font-bold tracking-tight tabular-nums shrink-0"
              style={{ color: topWinner.party.color }}
            >
              {topWinner.finalPercentage.toFixed(1)}
              <span className="text-[26px]">%</span>
            </span>
          </div>

          <div className="grid grid-cols-3 mt-5 border-y border-line divide-x divide-line">
            <div className="py-3 pr-3">
              <div className="font-serif text-xl font-semibold text-ink tabular-nums">
                {report.totalAnsweredQuestions}
              </div>
              <div className="text-[11px] text-stone mt-0.5">Respondidas</div>
            </div>
            <div className="py-3 px-3">
              <div className="font-serif text-xl font-semibold text-ink tabular-nums">
                {report.totalKeyQuestions}
              </div>
              <div className="text-[11px] text-stone mt-0.5">Temas clave (×2)</div>
            </div>
            <div className="py-3 pl-3">
              <div className="font-serif text-xl font-semibold text-ink tabular-nums">
                {precisionPct} %
              </div>
              <div className="text-[11px] text-stone mt-0.5">Solidez</div>
            </div>
          </div>
        </section>
      )}

      {/* Empate técnico */}
      {hasTechnicalTie && topWinner && secondWinner && nextTanda && (
        <section className="bg-mist p-5 rounded-[4px] flex flex-col gap-4">
          <div>
            <span className={KICKER}>Empate técnico</span>
            <p className="text-sm text-ink leading-relaxed mt-2">
              <strong className="font-semibold">{topWinner.party.siglas}</strong>{' '}
              y{' '}
              <strong className="font-semibold">{secondWinner.party.siglas}</strong>{' '}
              están prácticamente empatados (diferencia de{' '}
              {topGap.toFixed(1)} %). Juega la siguiente tanda para desempatar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartNextTanda(nextTanda)}
            className={BTN_PRIMARY}
          >
            Desempatar: tanda {nextTanda} · +{nextTandaQuestionsCount} preguntas
          </button>
        </section>
      )}

      {/* Solidez y siguiente tanda */}
      <section className="bg-mist p-5 rounded-[4px] flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className={KICKER}>
              Solidez del resultado · {completedTandas.length}/3 tandas
            </span>
            <span className="text-xs text-ink tabular-nums font-medium">
              {precisionPct} %
            </span>
          </div>
          <div className="w-full h-1 bg-track mt-2.5">
            <div
              className="h-full bg-ink transition-all duration-500"
              style={{ width: `${precisionPct}%` }}
            />
          </div>
        </div>

        {nextTanda ? (
          <>
            <p className="text-sm text-ink leading-relaxed">
              Tu resultado se basa en {report.totalAnsweredQuestions} preguntas.
              Puedes afinarlo con la tanda {nextTanda}, que añade preguntas
              nuevas sin perder lo ya respondido.
            </p>
            {!hasTechnicalTie && (
              <button
                type="button"
                onClick={() => onStartNextTanda(nextTanda)}
                className={BTN_PRIMARY}
              >
                Siguiente tanda: tanda {nextTanda} · +{nextTandaQuestionsCount}{' '}
                preguntas
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-ink leading-relaxed">
            Has completado las tres tandas del banco de preguntas. Precisión
            máxima alcanzada.
          </p>
        )}
      </section>

      {/* Brújula política */}
      <PoliticalCompass
        userCompass={report.userCompass}
        rankings={report.rankings}
      />

      {/* Ranking de las 8 candidaturas */}
      <section className={`${CARD} p-5`}>
        <span className={KICKER}>Afinidad con cada candidatura</span>
        <h2 className={`${SECTION_TITLE} mt-1`}>Ranking en Illes Balears</h2>

        <ol className="mt-4 divide-y divide-line border-t border-line">
          {report.rankings.map((item, idx) => {
            const highlights = getPartyBlockHighlights(
              item,
              data.metadata.bloques
            );

            return (
              <li key={item.party.id} className="py-4 flex gap-3">
                <span className="text-xs text-stone tabular-nums w-4 shrink-0 pt-1.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className="font-serif text-lg font-semibold leading-tight tracking-tight"
                      style={{ color: item.party.color }}
                    >
                      {item.party.nombre}
                    </h3>
                    <span
                      className="font-serif text-xl font-bold tabular-nums shrink-0"
                      style={{ color: item.party.color }}
                    >
                      {item.finalPercentage.toFixed(1)} %
                    </span>
                  </div>

                  <div className="mt-2 w-full h-2 bg-track">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(1, item.finalPercentage)}%`,
                        backgroundColor: item.party.color,
                      }}
                    />
                  </div>

                  {highlights && (
                    <p className="mt-2 text-xs text-ink leading-snug">
                      Más cerca en:{' '}
                      {highlights.closest.map((b, i) => (
                        <React.Fragment key={b.id}>
                          {i > 0 && ', '}
                          <strong className="font-semibold">{b.nombre}</strong>
                        </React.Fragment>
                      ))}{' '}
                      · Más lejos en:{' '}
                      <strong className="font-semibold">
                        {highlights.farthest.nombre}
                      </strong>
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-stone leading-snug">
                    {item.party.candidato_baleares} · Cobertura programática{' '}
                    {item.coveragePercentage} % ({item.questionsWithPosition}/
                    {item.totalAnsweredByUser} temas)
                    {item.questionsWithoutPosition > 0 &&
                      ` · ${item.questionsWithoutPosition} sin postura`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Desglose por bloques temáticos */}
      <section className={`${CARD} p-5`}>
        <span className={KICKER}>Desglose</span>
        <h2 className={`${SECTION_TITLE} mt-1`}>Afinidad por bloques</h2>
        <p className="text-sm text-stone mt-1 leading-relaxed">
          Qué candidatura coincide más contigo en cada eje. Pulsa un bloque
          para ver las ocho.
        </p>

        <div className="mt-4 divide-y divide-line border-t border-line">
          {data.metadata.bloques.map((bloque) => {
            const rankingForBlock = report.topPartyByBlock[bloque.id] || [];
            if (rankingForBlock.length === 0) return null;

            const leader = rankingForBlock[0];
            const runnerUp = rankingForBlock[1];
            const isExpanded = expandedBlock === bloque.id;

            return (
              <div key={bloque.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBlock((prev) =>
                      prev === bloque.id ? null : bloque.id
                    )
                  }
                  aria-expanded={isExpanded}
                  className="w-full py-3 flex items-start justify-between gap-3 text-left cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink group-hover:underline underline-offset-4 decoration-line-strong">
                      {bloque.nombre}
                    </div>
                    {leader && (
                      <div className="text-xs text-stone mt-0.5">
                        1.º{' '}
                        <span className="text-ink font-medium">
                          {leader.party.siglas}
                        </span>{' '}
                        {leader.percentage.toFixed(0)} %
                        {runnerUp && (
                          <>
                            {' '}· 2.º {runnerUp.party.siglas}{' '}
                            {runnerUp.percentage.toFixed(0)} %
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-base text-stone leading-none pt-0.5 shrink-0 w-4 text-center">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="pb-4 flex flex-col gap-2">
                    {rankingForBlock.map((entry) => (
                      <div
                        key={entry.party.id}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="w-20 font-medium text-ink truncate">
                          {entry.party.siglas}
                        </span>
                        <div className="flex-1 h-1.5 bg-track">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.max(1, entry.percentage)}%`,
                              backgroundColor: entry.party.color,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-ink">
                          {entry.percentage.toFixed(0)} %
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Auditoría con citas */}
      <AuditAccordion data={data} answers={answers} />

      {/* Reinicio */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onResetAll}
          className="text-xs text-stone underline underline-offset-4 decoration-line-strong hover:text-ink hover:decoration-ink transition-colors cursor-pointer"
        >
          Borrar respuestas y reiniciar el test
        </button>
      </div>
    </div>
  );
};
