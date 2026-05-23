import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

type ProgressItem = { lastVisited?: string; lastScore?: number; attempts: number };
type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  progress: Record<string, ProgressItem>;
};

const readUsers = async () => {
  const content = await fs.readFile(usersFilePath, "utf-8");
  const raw = JSON.parse(content) as any[];
  return raw.map((item) => ({
    id: item.id || crypto.randomUUID(),
    name: String(item.name || ""),
    email: String(item.email || "").toLowerCase(),
    role: item.role === "enseignant" ? "enseignant" : "eleve",
    progress: item.progress || {},
  })) as UserRecord[];
};

const writeUsers = async (users: UserRecord[]) => {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
};

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId")?.trim();
  const name = request.nextUrl.searchParams.get("name")?.trim().toLowerCase();
  if (!studentId && !name) {
    return NextResponse.json({ error: "studentId ou nom requis" }, { status: 400 });
  }

  const users = await readUsers();
  const user = studentId
    ? users.find((item) => item.id === studentId)
    : users.find((item) => item.name.toLowerCase() === name);

  return NextResponse.json({ progress: user?.progress ?? {} });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const studentId = String(body.studentId || "").trim();
  const name = String(body.name || "").trim().toLowerCase();
  const moduleId = String(body.moduleId || "").trim();
  const score = typeof body.score === "number" ? body.score : undefined;
  const timestamp = body.timestamp || new Date().toISOString();

  if ((!studentId && !name) || !moduleId) {
    return NextResponse.json({ error: "studentId ou nom et module requis" }, { status: 400 });
  }

  const users = await readUsers();
  const user = studentId
    ? users.find((item) => item.id === studentId)
    : users.find((item) => item.name.toLowerCase() === name);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const progress = user.progress[moduleId] ?? { attempts: 0 };
  const updatedProgress = {
    ...progress,
    lastVisited: timestamp,
    attempts: progress.attempts + 1,
  };

  if (typeof score === "number") {
    updatedProgress.lastScore = score;
  }

  user.progress[moduleId] = updatedProgress;
  await writeUsers(users);

  return NextResponse.json({ progress: user.progress });
}
