"use client";

import { useEffect, useState } from "react";

type Activity = {
  student: string;
  role: string;
  module: string | null;
  action: string;
  timestamp: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: "eleve" | "enseignant";
  school?: string;
};

type ProgressItem = {
  lastVisited?: string;
  lastScore?: number;
  attempts: number;
};

type StudentRecord = {
  id: string;
  name: string;
  email: string;
  role: "eleve" | "enseignant";
  school?: string;
  teacherId?: string;
  progress: Record<string, ProgressItem>;
};

type ModuleData = {
  id: string;
  title: string;
  summary: string;
  questions: Array<unknown>;
};

export default function TeacherPage() {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("didacticiel-user");
    if (!saved) {
      window.location.href = "/login";
      return;
    }
    const parsed = JSON.parse(saved) as User;
    if (parsed.role !== "enseignant") {
      window.location.href = "/login";
      return;
    }
    setUser(parsed);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [usersRes, modulesRes, activitiesRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/modules"),
          fetch("/api/activities"),
        ]);

        const [usersData, modulesData, activitiesData] = await Promise.all([
          usersRes.json(),
          modulesRes.json(),
          activitiesRes.json(),
        ]);

        const studentList = Array.isArray(usersData.users)
          ? usersData.users.filter(
              (item: StudentRecord) => item.role === "eleve" && item.school === user.school
            )
          : [];

        setStudents(studentList);
        setModules(Array.isArray(modulesData) ? modulesData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData.reverse() : []);
        if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const logout = () => {
    localStorage.removeItem("didacticiel-user");
    window.location.href = "/login";
  };

  const getModuleResult = (student: StudentRecord, module: ModuleData) => {
    const progress = student.progress?.[module.id];
    if (!progress) {
      return { label: "Pas commencé", variant: "neutral", subtitle: "Aucune action enregistrée" };
    }

    const read = Boolean(progress.lastVisited);
    const hasQuiz = typeof progress.lastScore === "number";
    const score = hasQuiz ? `${progress.lastScore} / ${module.questions.length}` : "-";
    const passed = hasQuiz && typeof progress.lastScore === "number" ? progress.lastScore >= Math.ceil(module.questions.length / 2) : false;

    if (hasQuiz) {
      return {
        label: passed ? "Réussi" : "Échoué",
        variant: passed ? "success" : "error",
        subtitle: `Quiz : ${score}`,
      };
    }

    if (read) {
      return {
        label: "Lu",
        variant: "info",
        subtitle: "Aucun quiz passé",
      };
    }

    return { label: "En cours", variant: "warning", subtitle: "Action partielle" };
  };

  const renderStudentCards = () => (
    <div className="student-grid">
      {students.map((student) => {
        const progressCount = Object.keys(student.progress ?? {}).length;
        const quizCount = Object.values(student.progress ?? {}).filter((item) => typeof item.lastScore === "number").length;
        return (
          <button
            key={student.id}
            type="button"
            className={`student-card ${selectedStudent?.id === student.id ? "selected" : ""}`}
            onClick={() => setSelectedStudent(student)}
          >
            <div>
              <h2>{student.name}</h2>
              <p className="student-card-meta">{progressCount} modules suivis · {quizCount} quiz</p>
            </div>
            <span className="student-card-arrow">›</span>
          </button>
        );
      })}
    </div>
  );

  const renderDetails = () => {
    if (!selectedStudent) {
      return <p>Aucun élève sélectionné.</p>;
    }

    return (
      <div className="card student-detail-card">
        <div className="student-detail-header">
          <div>
            <h2>{selectedStudent.name}</h2>
            <p className="student-summary">
              {Object.keys(selectedStudent.progress ?? {}).length} modules suivis · {Object.values(selectedStudent.progress ?? {}).filter((item) => typeof item.lastScore === "number").length} quiz complétés
            </p>
          </div>
        </div>

        <div className="module-progress-grid">
          {modules.map((module) => {
            const result = getModuleResult(selectedStudent, module);
            return (
              <div key={module.id} className="module-progress-item">
                <div>
                  <strong>{module.title}</strong>
                  <p>{module.summary}</p>
                </div>
                <div className={`module-status ${result.variant}`}>
                  <span>{result.label}</span>
                  <small>{result.subtitle}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Tableau de bord enseignant</h1>
          <p>Bonjour {user?.name}, tu peux cliquer sur un élève pour voir son parcours module par module.</p>
        </div>
        <button className="button secondary" type="button" onClick={logout}>
          Déconnexion
        </button>
      </div>

      <div className="teacher-view-grid">
        <div className="card activity-card">
          <h2>Élèves connectés</h2>
          {loading ? (
            <p>Chargement des élèves…</p>
          ) : students.length === 0 ? (
            <p>Aucun élève inscrit pour le moment.</p>
          ) : (
            renderStudentCards()
          )}
        </div>

        <div className="student-detail-wrapper">
          {loading ? <p>Chargement des détails…</p> : renderDetails()}
        </div>
      </div>

      <div className="card activity-card">
        <h2>Dernières activités des élèves</h2>
        {activities.length === 0 ? (
          <p>Aucune activité n’a encore été enregistrée.</p>
        ) : (
          <ul className="activity-list">
            {activities.map((activity, index) => (
              <li key={index} className="activity-item">
                <span className="activity-time">{new Date(activity.timestamp).toLocaleString("fr-FR")}</span>
                <strong>{activity.student}</strong> - {activity.action}
                {activity.module ? ` (module: ${activity.module})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
