"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ModuleData = {
  id: string;
  title: string;
  summary: string;
  content: string;
  questions: { question: string; choices: string[]; answer: string }[];
};

type ProgressData = {
  lastVisited?: string;
  lastScore?: number;
  attempts: number;
};

type User = {
  id: string;
  name: string;
  role: "eleve" | "enseignant";
};

type ModulePageProps = {
  params: {
    moduleId: string;
  };
};

export default function ModulePage({ params }: ModulePageProps) {
  const { moduleId } = params;
  const [user, setUser] = useState<User | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionValidated, setQuestionValidated] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const saved = localStorage.getItem("didacticiel-user");
    if (!saved) {
      window.location.href = "/login";
      return;
    }
    const parsed = JSON.parse(saved) as User;
    if (parsed.role !== "eleve") {
      window.location.href = "/login";
      return;
    }
    setUser(parsed);
  }, []);

  useEffect(() => {
    fetch("/api/modules")
      .then((response) => response.json())
      .then((data: ModuleData[]) => {
        const found = data.find((item) => item.id === moduleId);
        setModuleData(found ?? null);
      });
  }, [moduleId]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/progress?studentId=${encodeURIComponent(user.id)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.progress) {
          setProgress(data.progress[moduleId] ?? null);
        }
      });
  }, [moduleId, user]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    setShowTest(mode === "test");
  }, [searchParams]);

  useEffect(() => {
    if (!user || !moduleData) return;
    const recordOpen = async () => {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          student: user.name,
          role: user.role,
          module: moduleData.id,
          action: `Module ouvert: ${moduleData.title}`,
          timestamp: new Date().toISOString(),
        }),
      });
    };
    recordOpen();
  }, [user, moduleData]);

  const handleAnswer = (questionIndex: number, value: string) => {
    if (questionIndex !== currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [questionIndex]: value }));
  };

  const goToNext = () => {
    if (!moduleData || currentQuestion === moduleData.questions.length - 1) return;
    setCurrentQuestion((c) => Math.min(c + 1, moduleData.questions.length - 1));
    setQuestionValidated(false);
  };

  const goToPrev = () => {
    if (currentQuestion === 0) return;
    setCurrentQuestion((c) => Math.max(c - 1, 0));
    setQuestionValidated(false);
  };

  const startTest = () => {
    setShowTest(true);
    setCurrentQuestion(0);
    setAnswers({});
    setScore(null);
    setQuestionValidated(false);
  };

  const isSubmitted = score !== null;

  const recordProgress = async (scoreValue?: number) => {
    if (!user) return;
    const body: Record<string, unknown> = {
      studentId: user.id,
      moduleId,
      timestamp: new Date().toISOString(),
    };
    if (typeof scoreValue === "number") {
      body.score = scoreValue;
    }

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (result.progress) {
      setProgress(result.progress[moduleId] ?? null);
    }
  };

  const finishTest = async () => {
    if (!moduleData || !user || !questionValidated) return;

    const correctCount = moduleData.questions.reduce((total, question, index) => {
      return total + (answers[index] === question.answer ? 1 : 0);
    }, 0);

    setScore(correctCount);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        student: user.name,
        role: user.role,
        module: moduleData.id,
        action: `Test terminé: ${moduleData.title} score ${correctCount}/${moduleData.questions.length}`,
        timestamp: new Date().toISOString(),
      }),
    });
    await recordProgress(correctCount);
  };

  const validateAnswer = () => {
    if (!answers[currentQuestion]) return;
    setQuestionValidated(true);
  };

  if (!moduleData) {
    return (
      <main className="page-shell">
        <div className="card">
          <h1>Module introuvable</h1>
          <p>Ce module n’existe pas. Retourne à la liste des révisions.</p>
          <Link href="/student" className="button">
            Retour
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>{moduleData.title}</h1>
          <p>{moduleData.summary}</p>
          {progress && (
            <p className="module-progress">
              Dernière visite : {progress.lastVisited ? new Date(progress.lastVisited).toLocaleDateString("fr-FR") : "-"} • Score : {progress.lastScore ?? "-"} • essais : {progress.attempts}
            </p>
          )}
        </div>
        <Link href="/student" className="button secondary">
          Retour au tableau
        </Link>
      </div>

      <div className="card detail-card">
        {showTest ? (
          <div className="quiz-form">
            <p>Testez-vous sur ce module :</p>
            <div className="question-block">
              <strong>{moduleData.questions[currentQuestion].question}</strong>
              {moduleData.questions[currentQuestion].choices.map((choice) => {
                const isSelected = answers[currentQuestion] === choice;
                const isCorrectChoice = choice === moduleData.questions[currentQuestion].answer;
                const highlightClass = questionValidated
                  ? isSelected
                    ? isCorrectChoice
                      ? "choice-correct"
                      : "choice-incorrect"
                    : isCorrectChoice
                    ? "choice-correct"
                    : ""
                  : "";

                return (
                  <label key={choice} className={`choice-label ${highlightClass}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={choice}
                      checked={isSelected}
                      disabled={questionValidated}
                      onChange={() => handleAnswer(currentQuestion, choice)}
                    />
                    {choice}
                  </label>
                );
              })}
            </div>
            <div className="quiz-actions">
              <button type="button" className="button secondary" onClick={goToPrev} disabled={currentQuestion === 0 || questionValidated}>
                Précédent
              </button>
              {!questionValidated ? (
                <button type="button" className="button" onClick={validateAnswer} disabled={!answers[currentQuestion]}>
                  Valider la réponse
                </button>
              ) : currentQuestion === moduleData.questions.length - 1 ? (
                <button type="button" className="button" onClick={finishTest}>
                  Terminer
                </button>
              ) : (
                <button type="button" className="button" onClick={goToNext}>
                  Question suivante
                </button>
              )}
            </div>
            {score !== null && (
              <p className="result">Ton score : {score} / {moduleData.questions.length}</p>
            )}
          </div>
        ) : (
          <div>
            <p>{moduleData.content}</p>
            <div className="actions">
              <button type="button" className="button" onClick={startTest}>
                Passer au test
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
