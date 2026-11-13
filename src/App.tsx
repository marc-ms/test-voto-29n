import React, { useEffect, useState, useMemo } from 'react';
import {
  BlockId,
  LikertValue,
  PersistedState,
  QuestionnaireData,
  TandaNumber,
} from './types';
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from './engine/storage';
import { calculateAffinityReport } from './engine/affinity';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';

export const App: React.FC = () => {
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [persisted, setPersisted] = useState<PersistedState>(() =>
    loadPersistedState()
  );

  // Cargar public/data/cuestionario.json
  useEffect(() => {
    fetch('/data/cuestionario.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status} al cargar cuestionario.json`);
        }
        return res.json();
      })
      .then((json: QuestionnaireData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar los datos del cuestionario');
        setLoading(false);
      });
  }, []);

  // Sincronizar con localStorage en cada cambio
  useEffect(() => {
    savePersistedState(persisted);
  }, [persisted]);

  // Preguntas activas para la tanda y bloques seleccionados
  const activeQuestions = useMemo(() => {
    if (!data) return [];
    return data.preguntas.filter(
      (q) =>
        q.tanda === persisted.activeTanda &&
        (persisted.selectedBlocks.length === 0 ||
          persisted.selectedBlocks.includes(q.bloque))
    );
  }, [data, persisted.activeTanda, persisted.selectedBlocks]);

  const safeCurrentIndex = Math.min(
    persisted.currentIndex,
    Math.max(0, activeQuestions.length - 1)
  );

  // Informe matemático determinista
  const affinityReport = useMemo(() => {
    if (!data) return null;
    return calculateAffinityReport(
      data,
      persisted.answers,
      persisted.completedTandas.length,
      persisted.selectedBlocks
    );
  }, [
    data,
    persisted.answers,
    persisted.completedTandas.length,
    persisted.selectedBlocks,
  ]);

  const handleStartTanda = (tanda: TandaNumber, selectedBlocks: BlockId[]) => {
    setPersisted((prev) => ({
      ...prev,
      activeTanda: tanda,
      selectedBlocks,
      currentIndex: 0,
      currentScreen: 'quiz',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueQuiz = () => {
    setPersisted((prev) => ({
      ...prev,
      currentScreen: 'quiz',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswer = (
    questionId: string,
    value: LikertValue | null,
    weight: 0 | 1 | 2
  ) => {
    setPersisted((prev) => {
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: { questionId, value, weight },
      };

      const currentIdx = Math.min(
        prev.currentIndex,
        Math.max(0, activeQuestions.length - 1)
      );
      const isLastQuestion = currentIdx >= activeQuestions.length - 1;

      if (isLastQuestion) {
        const updatedCompleted = prev.completedTandas.includes(prev.activeTanda)
          ? prev.completedTandas
          : [...prev.completedTandas, prev.activeTanda];

        return {
          ...prev,
          answers: updatedAnswers,
          completedTandas: updatedCompleted,
          currentScreen: 'results',
        };
      } else {
        return {
          ...prev,
          answers: updatedAnswers,
          currentIndex: currentIdx + 1,
        };
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevQuestion = () => {
    setPersisted((prev) => {
      const currentIdx = Math.min(
        prev.currentIndex,
        Math.max(0, activeQuestions.length - 1)
      );
      return {
        ...prev,
        currentIndex: Math.max(0, currentIdx - 1),
      };
    });
  };

  const handleResetAll = () => {
    const fresh = clearPersistedState();
    setPersisted(fresh);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center w-full">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            Cargando banco de preguntas 29N Baleares...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-4 flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center w-full">
          <p className="text-sm font-bold text-rose-900 mb-1">
            No se pudo cargar el cuestionario
          </p>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen px-4 pt-4">
      {persisted.currentScreen === 'home' && (
        <HomeScreen
          data={data}
          persisted={persisted}
          onStartTanda={handleStartTanda}
          onContinueQuiz={handleContinueQuiz}
          onViewResults={() =>
            setPersisted((prev) => ({ ...prev, currentScreen: 'results' }))
          }
          onResetAll={handleResetAll}
        />
      )}

      {persisted.currentScreen === 'quiz' && (
        <QuizScreen
          tanda={persisted.activeTanda}
          questions={activeQuestions}
          blocks={data.metadata.bloques}
          currentIndex={safeCurrentIndex}
          answers={persisted.answers}
          onAnswer={handleAnswer}
          onPrevQuestion={handlePrevQuestion}
          onExitToHome={() =>
            setPersisted((prev) => ({ ...prev, currentScreen: 'home' }))
          }
        />
      )}

      {persisted.currentScreen === 'results' && affinityReport && (
        <ResultsScreen
          data={data}
          report={affinityReport}
          answers={persisted.answers}
          completedTandas={persisted.completedTandas}
          selectedBlocks={persisted.selectedBlocks}
          onStartNextTanda={(nextTanda) =>
            handleStartTanda(nextTanda, persisted.selectedBlocks)
          }
          onGoHome={() =>
            setPersisted((prev) => ({ ...prev, currentScreen: 'home' }))
          }
          onResetAll={handleResetAll}
        />
      )}
    </main>
  );
};

export default App;

