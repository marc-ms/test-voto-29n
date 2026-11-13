import React, { useState } from 'react';
import {
  BlockId,
  LikertValue,
  PartyId,
  QuestionnaireData,
  UserAnswer,
} from '../types';
import { calculateSingleQuestionMatchPercent } from '../engine/affinity';
import { CARD, KICKER, SECTION_TITLE } from './ui';

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
      return 'Más bien en contra (−1)';
    case -2:
      return 'Totalmente en contra (−2)';
  }
}

const SELECT_CLASS =
  'w-full text-sm bg-white border border-line-strong rounded-[4px] px-3 py-2 text-ink focus:outline-none focus:border-ink cursor-pointer';

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
    const matchesBlock = selectedBlock === 'ALL' || q.bloque === selectedBlock;
    return isAnswered && matchesBlock;
  });

  const partiesToDisplay =
    selectedParty === 'ALL'
      ? data.metadata.partidos
      : data.metadata.partidos.filter((p) => p.id === selectedParty);

  return (
    <section className={`${CARD} p-5 flex flex-col gap-4`}>
      <div>
        <span className={KICKER}>Auditoría de transparencia</span>
        <h2 className={`${SECTION_TITLE} mt-1`}>
          ¿Por qué me sale este resultado?
        </h2>
        <p className="text-sm text-stone mt-1 leading-relaxed">
          Compara pregunta a pregunta tu respuesta con la postura de cada
          partido, con la cita y la fuente de su programa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 border-y border-line py-4">
        <label className="block">
          <span className="block text-xs text-stone mb-1">Partido</span>
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value as PartyId | 'ALL')}
            className={SELECT_CLASS}
          >
            <option value="ALL">Todos los partidos</option>
            {data.metadata.partidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.siglas} — {p.candidato_baleares}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-stone mb-1">Bloque temático</span>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value as BlockId | 'ALL')}
            className={SELECT_CLASS}
          >
            <option value="ALL">Todos los bloques</option>
            {data.metadata.bloques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="divide-y divide-line">
        {answeredQuestions.length === 0 ? (
          <p className="text-center py-6 text-sm text-stone">
            No hay preguntas respondidas para este filtro.
          </p>
        ) : (
          answeredQuestions.map((q) => {
            const userAns = answers[q.id];
            const isOpen = openQuestionId === q.id;
            const blockMeta = data.metadata.bloques.find((b) => b.id === q.bloque);

            return (
              <div key={q.id}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenQuestionId((prev) => (prev === q.id ? null : q.id))
                  }
                  aria-expanded={isOpen}
                  className="w-full py-3.5 text-left flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-stone mb-1">
                      Tanda {q.tanda} · {blockMeta?.nombre || q.bloque}
                      {userAns?.weight === 2 && (
                        <span className="text-ink font-semibold"> · Tema clave ×2</span>
                      )}
                      {userAns?.weight === 0 && <span> · Saltada</span>}
                    </div>
                    <p className="font-serif text-[15px] font-semibold text-ink leading-snug group-hover:underline underline-offset-4 decoration-line-strong">
                      {q.enunciado}
                    </p>
                    <p className="mt-1.5 text-xs text-stone">
                      Tu postura:{' '}
                      <span className="text-ink font-medium">
                        {userAns?.weight === 0
                          ? 'Pregunta saltada (no computa)'
                          : formatLikertLabel(userAns?.value ?? null)}
                      </span>
                    </p>
                  </div>
                  <span className="text-base text-stone leading-none pt-1 shrink-0 w-4 text-center">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-4 flex flex-col divide-y divide-line border-t border-line">
                    {partiesToDisplay.map((party) => {
                      const pos = q.posturas[party.id];
                      const matchPct =
                        userAns && userAns.weight > 0 && userAns.value !== null && pos
                          ? calculateSingleQuestionMatchPercent(userAns.value, pos.valor)
                          : null;

                      return (
                        <div key={party.id} className="py-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-2 min-w-0">
                              <span
                                className="w-2 h-2 shrink-0 self-center"
                                style={{ backgroundColor: party.color }}
                              />
                              <span className="font-serif text-[15px] font-semibold text-ink">
                                {party.siglas}
                              </span>
                              <span className="text-xs text-stone truncate">
                                {formatLikertLabel(pos?.valor ?? null)}
                              </span>
                            </div>
                            <span className="text-xs tabular-nums shrink-0 text-ink">
                              {matchPct !== null
                                ? `${matchPct} % coincidencia`
                                : pos?.valor === null
                                ? <span className="text-stone">Silencio programático</span>
                                : <span className="text-stone">Sin evaluar</span>}
                            </span>
                          </div>

                          {pos?.cita && (
                            <blockquote className="mt-2 pl-3 border-l-2 border-line-strong text-[13px] text-ink/85 leading-relaxed">
                              {pos.cita}
                              {pos.fuente && (
                                <footer className="text-[11px] text-stone mt-1">
                                  Fuente: {pos.fuente}
                                </footer>
                              )}
                            </blockquote>
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
