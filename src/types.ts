export type PartyId = 'PP' | 'PSIB' | 'VOX' | 'ARAMES' | 'FO' | 'PACMA' | 'PCTE' | 'SALF';

export type BlockId =
  | 'vivienda'
  | 'turismo'
  | 'inmigracion'
  | 'medio_ambiente'
  | 'economia'
  | 'trabajo'
  | 'modelo_estado'
  | 'servicios_seguridad';

export type LikertValue = -2 | -1 | 0 | 1 | 2;
export type TandaNumber = 1 | 2 | 3;

export interface PartyMeta {
  id: PartyId;
  siglas: string;
  nombre: string;
  candidato_baleares: string;
  color: string;
}

export interface BlockMeta {
  id: BlockId;
  nombre: string;
  icono: string;
}

export interface PartyPosition {
  valor: LikertValue | null;
  cita: string;
  fuente: string;
}

export interface PressClip {
  titular: string;
  fuente: string;
}

export interface PressDebate {
  izquierda: PressClip;
  derecha: PressClip;
}

export interface Question {
  id: string;
  tanda: TandaNumber;
  bloque: BlockId;
  tipo: string;
  enunciado: string;
  contexto_opcional?: string;
  debate_prensa?: PressDebate;
  posturas: Record<PartyId, PartyPosition>;
}

export interface QuestionnaireData {
  metadata: {
    elecciones: string;
    ultima_actualizacion: string;
    version: string;
    partidos: PartyMeta[];
    bloques: BlockMeta[];
  };
  preguntas: Question[];
}

export interface UserAnswer {
  questionId: string;
  value: LikertValue | null; // null if skipped
  weight: 0 | 1 | 2; // 0 = skipped, 1 = normal, 2 = double weight ("Tema clave")
}

export interface PersistedState {
  answers: Record<string, UserAnswer>;
  completedTandas: TandaNumber[];
  activeTanda: TandaNumber;
  currentIndex: number;
  selectedBlocks: BlockId[]; // empty = all 8 blocks
  currentScreen: 'home' | 'quiz' | 'results';
}

export interface PartyBlockScore {
  blockId: BlockId;
  affinityPercentage: number;
  answeredQuestionsCount: number;
  definedPositionsCount: number;
}

export interface CompassCoordinates {
  economico: number; // -100 (Izquierda) a +100 (Derecha)
  social: number; // -100 (Progresista) a +100 (Conservador)
  economicoCount: number;
  socialCount: number;
}

export interface PartyResult {
  party: PartyMeta;
  finalPercentage: number;
  rawAffinityPercentage: number;
  coveragePercentage: number;
  coverageFactor: number;
  questionsWithPosition: number;
  questionsWithoutPosition: number;
  totalAnsweredByUser: number;
  blockScores: Record<BlockId, PartyBlockScore>;
  compass: CompassCoordinates;
}

export interface AffinityReport {
  rankings: PartyResult[];
  topPartyByBlock: Record<BlockId, { party: PartyMeta; percentage: number }[]>;
  userCompass: CompassCoordinates;
  totalAnsweredQuestions: number;
  totalSkippedQuestions: number;
  totalKeyQuestions: number;
  completedTandasCount: number;
}

