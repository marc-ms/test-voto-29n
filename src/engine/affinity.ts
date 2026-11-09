import {
  AffinityReport,
  BlockId,
  LikertValue,
  PartyBlockScore,
  PartyMeta,
  PartyResult,
  Question,
  QuestionnaireData,
  UserAnswer,
} from '../types';

/**
 * Calcula la afinidad de una sola pregunta entre el usuario (U_i) y un partido (P_i),
 * multiplicada por el peso de importancia (W_i).
 * Fórmula: (1 - (Math.abs(U_i - P_i) / 4)) * W_i
 */
export function calculateQuestionAffinity(
  userVal: LikertValue,
  partyVal: LikertValue,
  weight: number
): number {
  return (1 - Math.abs(userVal - partyVal) / 4) * weight;
}

/**
 * Calcula el porcentaje de coincidencia (0-100%) en una pregunta individual sin ponderar.
 */
export function calculateSingleQuestionMatchPercent(
  userVal: LikertValue,
  partyVal: LikertValue | null
): number | null {
  if (partyVal === null || partyVal === undefined) return null;
  return Math.round((1 - Math.abs(userVal - partyVal) / 4) * 100);
}

/**
 * Motor matemático determinista que calcula el ranking general, cobertura programática
 * y desglose por bloques temáticos según SPEC.md (Sección 5).
 */
export function calculateAffinityReport(
  data: QuestionnaireData,
  answers: Record<string, UserAnswer>,
  completedTandasCount: number,
  selectedBlocks: BlockId[] = []
): AffinityReport {
  const activeQuestions = data.preguntas.filter((q) => {
    const matchesBlock =
      selectedBlocks.length === 0 || selectedBlocks.includes(q.bloque);
    const ans = answers[q.id];
    return matchesBlock && ans !== undefined;
  });

  const validAnsweredQuestions: { question: Question; answer: UserAnswer }[] = [];
  let totalSkippedQuestions = 0;
  let totalKeyQuestions = 0;

  for (const q of activeQuestions) {
    const ans = answers[q.id];
    if (!ans || ans.weight === 0 || ans.value === null) {
      totalSkippedQuestions++;
    } else {
      validAnsweredQuestions.push({ question: q, answer: ans });
      if (ans.weight === 2) {
        totalKeyQuestions++;
      }
    }
  }

  const totalAnsweredQuestions = validAnsweredQuestions.length;

  const rankings: PartyResult[] = data.metadata.partidos.map((party: PartyMeta) => {
    let sumaAfinidad = 0;
    let sumaPesosValidos = 0;
    let questionsWithPosition = 0;
    let questionsWithoutPosition = 0;

    // Acumuladores por bloque
    const blockAccumulators: Record<
      BlockId,
      {
        sumaAfinidad: number;
        sumaPesosValidos: number;
        answeredCount: number;
        definedCount: number;
      }
    > = {
      vivienda: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      turismo: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      inmigracion: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      medio_ambiente: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      economia: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      trabajo: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      modelo_estado: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
      servicios_seguridad: { sumaAfinidad: 0, sumaPesosValidos: 0, answeredCount: 0, definedCount: 0 },
    };

    for (const { question, answer } of validAnsweredQuestions) {
      const userVal = answer.value as LikertValue;
      const weight = answer.weight;
      const postura = question.posturas[party.id];
      const partyVal = postura ? postura.valor : null;

      const blockAcc = blockAccumulators[question.bloque];
      blockAcc.answeredCount++;

      if (partyVal !== null && partyVal !== undefined) {
        const afinidadPregunta = calculateQuestionAffinity(userVal, partyVal, weight);
        sumaAfinidad += afinidadPregunta;
        sumaPesosValidos += weight;
        questionsWithPosition++;

        blockAcc.sumaAfinidad += afinidadPregunta;
        blockAcc.sumaPesosValidos += weight;
        blockAcc.definedCount++;
      } else {
        questionsWithoutPosition++;
      }
    }

    const coberturaPartido =
      totalAnsweredQuestions > 0
        ? questionsWithPosition / totalAnsweredQuestions
        : 1;

    const factorCobertura = Math.min(1, coberturaPartido / 0.70);

    const rawAffinityPercentage =
      sumaPesosValidos > 0 ? (sumaAfinidad / sumaPesosValidos) * 100 : 0;

    const finalPercentage = rawAffinityPercentage * factorCobertura;

    const blockScores = {} as Record<BlockId, PartyBlockScore>;
    for (const block of data.metadata.bloques) {
      const acc = blockAccumulators[block.id];
      const blockCoherencia =
        acc.answeredCount > 0 ? acc.definedCount / acc.answeredCount : 1;
      const blockFactor = Math.min(1, blockCoherencia / 0.70);
      const rawBlockPct =
        acc.sumaPesosValidos > 0
          ? (acc.sumaAfinidad / acc.sumaPesosValidos) * 100
          : 0;

      blockScores[block.id] = {
        blockId: block.id,
        affinityPercentage: Math.round(rawBlockPct * blockFactor * 10) / 10,
        answeredQuestionsCount: acc.answeredCount,
        definedPositionsCount: acc.definedCount,
      };
    }

    return {
      party,
      finalPercentage: Math.round(finalPercentage * 10) / 10,
      rawAffinityPercentage: Math.round(rawAffinityPercentage * 10) / 10,
      coveragePercentage: Math.round(coberturaPartido * 100),
      coverageFactor: Math.round(factorCobertura * 100) / 100,
      questionsWithPosition,
      questionsWithoutPosition,
      totalAnsweredByUser: totalAnsweredQuestions,
      blockScores,
    };
  });

  // Ordenar de mayor a menor afinidad final (y en caso de empate, por mayor cobertura)
  rankings.sort((a, b) => {
    if (b.finalPercentage !== a.finalPercentage) {
      return b.finalPercentage - a.finalPercentage;
    }
    return b.coveragePercentage - a.coveragePercentage;
  });

  // Calcular ranking por bloque temático
  const topPartyByBlock = {} as Record<
    BlockId,
    { party: PartyMeta; percentage: number }[]
  >;

  for (const block of data.metadata.bloques) {
    const list = rankings
      .filter((r) => r.blockScores[block.id].answeredQuestionsCount > 0)
      .map((r) => ({
        party: r.party,
        percentage: r.blockScores[block.id].affinityPercentage,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    topPartyByBlock[block.id] = list;
  }

  return {
    rankings,
    topPartyByBlock,
    totalAnsweredQuestions,
    totalSkippedQuestions,
    totalKeyQuestions,
    completedTandasCount,
  };
}

