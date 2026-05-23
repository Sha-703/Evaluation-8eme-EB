"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ModuleData = {
  id: string;
  title: string;
  summary: string;
};

type ProgressData = { lastVisited?: string; lastScore?: number; attempts: number };

type User = { id: string; name: string; role: "eleve" | "enseignant" };

export default function StudentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});

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
      .then((r) => r.json())
      .then((data) => setModules(data.slice(0, 5)));

    if (user) {
      fetch(`/api/progress?studentId=${encodeURIComponent(user.id)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.progress) setProgress(data.progress);
        });
    }
  }, [user]);

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Révisions — Espace élève</h1>
          <p>Bonjour {user?.name} — sélectionne un module pour réviser ou tester.</p>
        </div>
      </div>

      <section className="card">
        <div className="modules-display">
          {modules.map((m) => {
            const p = progress[m.id];
            return (
              <Link key={m.id} href={`/student/${m.id}`} className="module-card">
                <h3>{m.title}</h3>
                <p className="module-summary">{m.summary}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <small>{p ? `Dernier: ${p.lastScore ?? "-"}` : "-"}</small>
                  <span className="progress-badge">{p ? `${p.attempts} essais` : "-"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
