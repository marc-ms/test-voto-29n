import {
  AffinityReport,
  BlockId,
  CompassCoordinates,
  LikertValue,
  PartyBlockScore,
  PartyMeta,
  PartyResult,
  Question,
  QuestionnaireData,
  UserAnswer,
} from '../types';

/**
 * Polaridades para el Eje Económico (-1 = Izquierda, +1 = Derecha cuando se responde a favor).
 */
const ECONOMIC_POLARITY: Record<string, -1 | 1> = {
  viv_01: -1,
  viv_02: -1,
  viv_04: -1,
  viv_06: -1,
  tur_01: -1,
  tur_02: -1,
  tur_04: -1,
  tur_07: -1,
  tur_08: -1,
  eco_03: -1,
  eco_05: -1,
  tra_01: -1,
  tra_03: -1,
  tra_04: -1,
  tra_05: -1,
  tra_06: -1,
  ser_01: -1,
  ser_05: -1,
  ser_06: -1,
  viv_05: 1,
  viv_07: 1,
  viv_08: 1,
  eco_01: 1,
  eco_04: 1,
  eco_06: 1,
  eco_08: 1,
  tra_07: 1,
  tra_08: 1,
};

/**
 * Polaridades para el Eje Social (+1 = Conservador, -1 = Progresista cuando se responde a favor).
 */
const SOCIAL_POLARITY: Record<string, -1 | 1> = {
  viv_03: 1,
  inm_01: 1,
  inm_02: 1,
  inm_04: 1,
  inm_05: 1,
  inm_07: 1,
  inm_08: 1,
  med_03: 1,
  med_07: 1,
  tra_08: 1,
  ser_07: 1,
  ser_08: 1,
  inm_03: -1,
  med_01: -1,
  med_02: -1,
  med_04: -1,
  med_05: -1,
  med_06: -1,
  med_08: -1,
  mod_06: -1,
};

/**
 * Calcula las coordenadas normalizadas (-100 a +100) en los ejes económico y social
 * a partir de una lista de respuestas o posturas ponderadas.
 */
export function calculateCompassCoordinates(
  entries: { questionId: string; value: LikertValue | null; weight: number }[]
): CompassCoordinates {
  let ecoWeightedSum = 0;
  let ecoMaxSum = 0;
  let economicoCount = 0;

  let socWeightedSum = 0;
  let socMaxSum = 0;
  let socialCount = 0;

  for (const { questionId, value, weight } of entries) {
    if (value === null || value === undefined || weight <= 0) {
      continue;
    }

    const ecoPol = ECONOMIC_POLARITY[questionId];
    if (ecoPol !== undefined) {
      ecoWeightedSum += value * ecoPol * weight;
      ecoMaxSum += 2 * weight;
      economicoCount++;
    }

    const socPol = SOCIAL_POLARITY[questionId];
    if (socPol !== undefined) {
      socWeightedSum += value * socPol * weight;
      socMaxSum += 2 * weight;
      socialCount++;
    }
  }

  const economico =
    ecoMaxSum > 0 ? Math.round((ecoWeightedSum / ecoMaxSum) * 1000) / 10 : 0;
  const social =
    socMaxSum > 0 ? Math.round((socWeightedSum / socMaxSum) * 1000) / 10 : 0;

  return {
    economico,
    social,
    economicoCount,
    socialCount,
  };
}

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
 * Motor matemático determinista que calcula el ranking general, cobertura programática,
 * brújula política 2D y desglose por bloques temáticos según SPEC.md (Sección 5).
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

  const userCompass = calculateCompassCoordinates(
    validAnsweredQuestions.map(({ question, answer }) => ({
      questionId: question.id,
      value: answer.value,
      weight: answer.weight,
    }))
  );

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

    const partyCompassEntries: {
      questionId: string;
      value: LikertValue | null;
      weight: number;
    }[] = [];

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

        partyCompassEntries.push({
          questionId: question.id,
          value: partyVal,
          weight,
        });
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

    const compass = calculateCompassCoordinates(partyCompassEntries);

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
      compass,
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
    userCompass,
    totalAnsweredQuestions,
    totalSkippedQuestions,
    totalKeyQuestions,
    completedTandasCount,
  };
}
