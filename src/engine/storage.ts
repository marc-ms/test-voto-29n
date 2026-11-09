import { PersistedState } from '../types';

const STORAGE_KEY = 'baleares_29n_affinity_state_v1';

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  answers: {},
  completedTandas: [],
  activeTanda: 1,
  currentIndex: 0,
  selectedBlocks: [],
  currentScreen: 'home',
};

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSISTED_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PERSISTED_STATE,
      ...parsed,
    };
  } catch (e) {
    console.warn('Error loading state from localStorage:', e);
    return { ...DEFAULT_PERSISTED_STATE };
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving state to localStorage:', e);
  }
}

export function clearPersistedState(): PersistedState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }
  return { ...DEFAULT_PERSISTED_STATE };
}

