"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: string; name: string; role: "eleve" | "enseignant" };
type ProgressRecord = Record<string, { lastVisited?: string; lastScore?: number; attempts: number }>;
type ProgressResponse = { progress: ProgressRecord };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [modulesCount, setModulesCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("didacticiel-user");
    if (!saved) {
      window.location.href = "/login";
      return;
    }
    setUser(JSON.parse(saved) as User);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [modulesRes, progressRes] = await Promise.all([
          fetch("/api/modules"),
          fetch(`/api/progress?studentId=${encodeURIComponent(user.id)}`),
        ]);

        if (!modulesRes.ok || !progressRes.ok) {
          setStatsLoading(false);
          return;
        }

        const modules = await modulesRes.json();
        const progressData = (await progressRes.json()) as ProgressResponse;

        setModulesCount(Array.isArray(modules) ? modules.length : 0);
        setProgress(progressData.progress ?? {});
      } catch (error) {
        console.error(error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const readModules = progress ? Object.values(progress).filter((item) => item.lastVisited).length : 0;
  const quizModules = progress ? Object.values(progress).filter((item) => typeof item.lastScore === "number").length : 0;
  const averageScore = progress
    ? (() => {
        const scores = Object.values(progress)
          .map((item) => item.lastScore)
          .filter((score): score is number => typeof score === "number");
        if (scores.length === 0) return null;
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      })()
    : null;
  const readPercent = modulesCount ? Math.round((readModules / modulesCount) * 100) : 0;
  const quizPercent = modulesCount ? Math.round((quizModules / modulesCount) * 100) : 0;

  if (loading) {
    return (
      <main className="page-shell">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Bienvenue {user?.name}</h1>
          <p>Sélectionne un espace pour continuer</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {user?.role === "eleve" && (
          <Link href="/student" className="dashboard-card">
            <div className="card-icon">📚</div>
            <h2>Espace élève</h2>
            <p>Accède aux modules de révision et passe les tests</p>
          </Link>
        )}

        {user?.role === "eleve" && (
          <div className="dashboard-card progress-card">
            <div className="progress-header">
              <h2>Progression</h2>
              <p className="progress-subtitle">Lecture et quiz terminés</p>
            </div>

            <div className="progress-row">
              <div className="progress-label">Modules lus</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${readPercent}%` }} />
              </div>
              <div className="progress-meta">{readModules} / {modulesCount} modules ({readPercent}%)</div>
            </div>

            <div className="progress-row">
              <div className="progress-label">Quiz complétés</div>
              <div className="progress-bar">
                <div className="progress-fill quiz" style={{ width: `${quizPercent}%` }} />
              </div>
              <div className="progress-meta">{quizModules} / {modulesCount} modules ({quizPercent}%)</div>
            </div>

            {averageScore !== null && <p className="progress-average">Score moyen : {averageScore}%</p>}
            {statsLoading && <p className="progress-loading">Chargement des données de progression...</p>}
            {!statsLoading && modulesCount === 0 && <p className="progress-loading">Aucun module disponible pour calculer la progression.</p>}
          </div>
        )}

        {user?.role === "enseignant" && (
          <Link href="/teacher" className="dashboard-card">
            <div className="card-icon">👨‍🏫</div>
            <h2>Espace enseignant</h2>
            <p>Consulte la progression et les résultats des élèves</p>
          </Link>
        )}
      </div>
    </main>
  );
}
