import React, { useState } from 'react';
import {
  BlockId,
  LikertValue,
  PartyId,
  QuestionnaireData,
  UserAnswer,
} from '../types';
import { calculateSingleQuestionMatchPercent } from '../engine/affinity';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  Filter,
  Quote,
} from 'lucide-react';

interface AuditAccordionProps {
  data: QuestionnaireData;
  answers: Record<string, UserAnswer>;
  initialPartyFilter?: PartyId | 'ALL';
}

function formatLikertLabel(val: LikertValue | null): string {
  if (val === null || val === undefined) return 'Sin postura definida';
  switch (val) {
    case 2:
      return 'Totalmente a favor (+2)';
    case 1:
      return 'Más bien a favor (+1)';
    case 0:
      return 'Neutral / Depende (0)';
    case -1:
      return 'Más bien en contra (-1)';
    case -2:
      return 'Totalmente en contra (-2)';
  }
}

function formatShortLikert(val: LikertValue | null): string {
  if (val === null || val === undefined) return 'N/A';
  if (val > 0) return `+${val}`;
  return `${val}`;
}

export const AuditAccordion: React.FC<AuditAccordionProps> = ({
  data,
  answers,
  initialPartyFilter = 'ALL',
}) => {
  const [selectedParty, setSelectedParty] = useState<PartyId | 'ALL'>(
    initialPartyFilter
  );
  const [selectedBlock, setSelectedBlock] = useState<BlockId | 'ALL'>('ALL');
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const answeredQuestions = data.preguntas.filter((q) => {
    const ans = answers[q.id];
    const isAnswered = ans !== undefined;
    const matchesBlock =
      selectedBlock === 'ALL' || q.bloque === selectedBlock;
    return isAnswered && matchesBlock;
  });

  const partiesToDisplay =
    selectedParty === 'ALL'
      ? data.metadata.partidos
      : data.metadata.partidos.filter((p) => p.id === selectedParty);

  return (
    <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-900">
            ¿Por qué me sale este resultado?
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Auditoría de transparencia pregunta a pregunta. Filtra por partido o
          bloque para comparar tu respuesta con la cita y fuente exacta de cada
          programa electoral.
        </p>
      </div>

      {/* Filtros por Partido y por Bloque */}
      <div className="flex flex-col gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filtrar citas programáticas:</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Partido político:
            </label>
            <select
              value={selectedParty}
              onChange={(e) =>
                setSelectedParty(e.target.value as PartyId | 'ALL')
              }
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos los partidos (8 candidaturas)</option>
              {data.metadata.partidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.siglas} — {p.nombre} ({p.candidato_baleares})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Bloque temático:
            </label>
            <select
              value={selectedBlock}
              onChange={(e) =>
                setSelectedBlock(e.target.value as BlockId | 'ALL')
              }
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos los bloques temáticos (8)</option>
              {data.metadata.bloques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de acordeones por pregunta */}
      <div className="flex flex-col gap-2.5">
        {answeredQuestions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No hay preguntas respondidas para este filtro.
          </div>
        ) : (
          answeredQuestions.map((q) => {
            const userAns = answers[q.id];
            const isOpen = openQuestionId === q.id;
            const blockMeta = data.metadata.bloques.find(
              (b) => b.id === q.bloque
            );

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white transition"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenQuestionId((prev) => (prev === q.id ? null : q.id))
                  }
                  className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        Tanda {q.tanda} · {blockMeta?.nombre || q.bloque}
                      </span>
                      {userAns?.weight === 2 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3" /> Doble peso (x2)
                        </span>
                      )}
                      {userAns?.weight === 0 && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                          Saltada
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {q.enunciado}
                    </p>

                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Tu postura:{' '}
                      <strong className="text-slate-800">
                        {userAns?.weight === 0
                          ? 'Pregunta saltada (No computa)'
                          : formatLikertLabel(userAns?.value ?? null)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-1">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3.5 pt-2 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2.5">
                    {partiesToDisplay.map((party) => {
                      const pos = q.posturas[party.id];
                      const matchPct =
                        userAns &&
                        userAns.weight > 0 &&
                        userAns.value !== null &&
                        pos
                          ? calculateSingleQuestionMatchPercent(
                              userAns.value,
                              pos.valor
                            )
                          : null;

                      return (
                        <div
                          key={party.id}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: party.color }}
                              />
                              <span className="text-xs font-extrabold text-slate-900">
                                {party.siglas}
                              </span>
                              <span className="text-[11px] font-mono font-semibold text-slate-500">
                                ({formatShortLikert(pos?.valor ?? null)})
                              </span>
                            </div>

                            {matchPct !== null ? (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  matchPct >= 75
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : matchPct >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {matchPct}% coincidencia
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {pos?.valor === null
                                  ? 'Silencio programático'
                                  : 'Sin evaluar'}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-semibold text-slate-700 mb-1">
                            Postura: {formatLikertLabel(pos?.valor ?? null)}
                          </div>

                          {pos?.cita && (
                            <div className="flex items-start gap-1.5 text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                "{pos.cita}"
                                {pos.fuente && (
                                  <div className="not-italic text-[10px] font-semibold text-slate-400 mt-1">
                                    Fuente: {pos.fuente}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

