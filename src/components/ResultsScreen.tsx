import React, { useState } from 'react';
import {
  AffinityReport,
  BlockId,
  QuestionnaireData,
  TandaNumber,
  UserAnswer,
} from '../types';
import { BlockIcon } from './BlockIcon';
import { AuditAccordion } from './AuditAccordion';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Flame,
  Home,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface ResultsScreenProps {
  data: QuestionnaireData;
  report: AffinityReport;
  answers: Record<string, UserAnswer>;
  completedTandas: TandaNumber[];
  selectedBlocks: BlockId[];
  onStartNextTanda: (tanda: TandaNumber) => void;
  onGoHome: () => void;
  onResetAll: () => void;
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
}) => {
  const [expandedBlock, setExpandedBlock] = useState<BlockId | null>(null);

  const topWinner = report.rankings[0];
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

  const precisionPct =
    completedTandas.length >= 3
      ? 100
      : completedTandas.length === 2
      ? 66
      : completedTandas.length === 1
      ? 33
      : Math.min(
          100,
          Math.round((report.totalAnsweredQuestions / data.preguntas.length) * 100)
        );

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          Inicio / Tandas
        </button>

        <span className="text-xs font-bold text-slate-500">
          {report.totalAnsweredQuestions} preguntas evaluadas
        </span>
      </div>

      {/* Podio Principal / Ganador */}
      {topWinner && (
        <section
          className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${topWinner.party.color} 0%, #0f172a 95%)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full">
              <Award className="w-3.5 h-3.5" /> Mayor Afinidad Electoral
            </span>
            <span className="text-xs font-semibold bg-black/25 px-2.5 py-1 rounded-full">
              Transparencia: {topWinner.coveragePercentage}%
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {topWinner.party.siglas}
              </h1>
              <p className="text-sm font-medium text-white/90 mt-0.5">
                {topWinner.party.nombre}
              </p>
              <p className="text-xs text-white/75 mt-1">
                Cabeza de lista Baleares:{' '}
                <strong className="text-white">
                  {topWinner.party.candidato_baleares}
                </strong>
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-4xl font-black tracking-tight">
                {topWinner.finalPercentage.toFixed(1)}%
              </div>
              <div className="text-[11px] text-white/75 font-medium">
                de coincidencia
              </div>
            </div>
          </div>

          {/* Resumen rápido de métricas del usuario */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/15 text-center">
            <div>
              <div className="text-xs font-bold">
                {report.totalAnsweredQuestions}
              </div>
              <div className="text-[10px] text-white/70">Respondidas</div>
            </div>
            <div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-300" />
                {report.totalKeyQuestions}
              </div>
              <div className="text-[10px] text-white/70">Temas clave (x2)</div>
            </div>
            <div>
              <div className="text-xs font-bold">{precisionPct}%</div>
              <div className="text-[10px] text-white/70">Solidez del test</div>
            </div>
          </div>
        </section>
      )}

      {/* Indicador de Solidez del Resultado + CTA Siguiente Tanda */}
      <section className="bg-indigo-950 text-white rounded-3xl p-5 shadow-md border border-indigo-800/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
            Solidez del Resultado ({Math.max(1, completedTandas.length)}/3 Tandas)
          </span>
          <span className="text-xs font-bold bg-indigo-500/30 text-indigo-100 px-2.5 py-0.5 rounded-full">
            Precisión: {precisionPct}%
          </span>
        </div>

        <div className="w-full h-2 bg-indigo-900 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${precisionPct}%` }}
          />
        </div>

        {nextTanda ? (
          <>
            <p className="text-xs text-indigo-200 leading-relaxed mb-3.5">
              Tu resultado actual se basa en{' '}
              <strong className="text-white">
                {report.totalAnsweredQuestions} preguntas
              </strong>
              . Puedes consolidar tu afinidad sumando la{' '}
              <strong className="text-white">Tanda {nextTanda}</strong> con
              nuevas preguntas sin perder lo ya respondido.
            </p>
            <button
              onClick={() => onStartNextTanda(nextTanda)}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Afianzar afinidad: Hacer Tanda {nextTanda} (+
              {nextTandaQuestionsCount} preguntas nuevas)
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              ¡Has completado las 3 tandas del banco de preguntas! Máxima
              precisión alcanzada (100 %).
            </span>
          </div>
        )}
      </section>

      {/* Ranking Completo de los 8 Partidos */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            Ranking de las 8 Candidaturas (Baleares)
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Afinidad y Cobertura
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {report.rankings.map((item, idx) => (
            <div
              key={item.party.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: item.party.color }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {item.party.siglas}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        · {item.party.candidato_baleares}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.party.nombre}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-slate-900">
                    {item.finalPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Barra animada del partido */}
              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(2, item.finalPercentage)}%`,
                    backgroundColor: item.party.color,
                  }}
                />
              </div>

              {/* Índice de Transparencia / Cobertura Programática */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Cobertura programática:{' '}
                  <strong className="text-slate-700">
                    {item.coveragePercentage}%
                  </strong>{' '}
                  ({item.questionsWithPosition}/{item.totalAnsweredByUser} temas)
                </span>
                {item.questionsWithoutPosition > 0 && (
                  <span className="text-amber-700 font-medium">
                    {item.questionsWithoutPosition} sin postura
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Desglose por los 8 Bloques Temáticos */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col gap-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Afinidad por Bloques Temáticos
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Descubre qué partido coincide más contigo en cada uno de los 8 ejes
            de Baleares. Pulsa en un bloque para ver todos los partidos.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {data.metadata.bloques.map((bloque) => {
            const rankingForBlock = report.topPartyByBlock[bloque.id] || [];
            if (rankingForBlock.length === 0) return null;

            const leader = rankingForBlock[0];
            const isExpanded = expandedBlock === bloque.id;

            return (
              <div
                key={bloque.id}
                className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/40"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBlock((prev) =>
                      prev === bloque.id ? null : bloque.id
                    )
                  }
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <BlockIcon iconName={bloque.icono} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">
                        {bloque.nombre}
                      </div>
                      {leader && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: leader.party.color }}
                          />
                          <span className="text-[11px] font-bold text-slate-700">
                            1.º {leader.party.siglas} ({leader.percentage}%)
                          </span>
                          {rankingForBlock[1] && (
                            <span className="text-[11px] text-slate-400">
                              · 2.º {rankingForBlock[1].party.siglas} (
                              {rankingForBlock[1].percentage}%)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-3.5 pt-2 bg-white border-t border-slate-100 flex flex-col gap-2">
                    {rankingForBlock.map((entry) => (
                      <div
                        key={entry.party.id}
                        className="flex items-center gap-2.5 text-xs"
                      >
                        <span className="w-24 font-bold text-slate-700 truncate">
                          {entry.party.siglas}
                        </span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(2, entry.percentage)}%`,
                              backgroundColor: entry.party.color,
                            }}
                          />
                        </div>
                        <span className="w-11 text-right font-mono font-bold text-slate-800">
                          {entry.percentage.toFixed(0)}%
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

      {/* Acordeón de Auditoría de Transparencia con Citas */}
      <AuditAccordion data={data} answers={answers} />

      {/* Botón inferior para reiniciar */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 py-2 px-4 rounded-xl transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Borrar respuestas y reiniciar todo el test
        </button>
      </div>
    </div>
  );
};

