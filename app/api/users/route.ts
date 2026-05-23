import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const usersFilePath = path.join(process.cwd(), "data", "users.json");

type ProgressRecord = Record<string, { lastVisited?: string; lastScore?: number; attempts: number }>;
type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "eleve" | "enseignant";
  teacherId?: string;
  school: string;
  progress: ProgressRecord;
};

const hashPassword = (password: string) => crypto.createHash("sha256").update(password).digest("hex");

const sanitize = (user: UserRecord) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  teacherId: user.teacherId,
  school: user.school,
  progress: user.progress ?? {},
});

const readUsers = async () => {
  const content = await fs.readFile(usersFilePath, "utf-8");
  const raw = JSON.parse(content) as any[];
  return raw.map((item) => ({
    id: item.id || crypto.randomUUID(),
    name: String(item.name || ""),
    email: String(item.email || "").toLowerCase(),
    passwordHash: String(item.passwordHash || ""),
    role: item.role === "enseignant" ? "enseignant" : "eleve",
    teacherId: item.teacherId,
    school: String(item.school || ""),
    progress: item.progress || {},
  })) as UserRecord[];
};

const writeUsers = async (users: UserRecord[]) => {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
};

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const name = request.nextUrl.searchParams.get("name")?.trim().toLowerCase();
  const users = await readUsers();

  if (!email && !name) {
    return NextResponse.json({ users: users.map(sanitize) });
  }

  const user = email
    ? users.find((item) => item.email === email)
    : users.find((item) => item.name.toLowerCase() === name);

  return NextResponse.json({ user: user ? sanitize(user) : null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const mode = body.mode === "signup" ? "signup" : "login";
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const role = body.role === "enseignant" ? "enseignant" : "eleve";
  const school = String(body.school || "").trim();

  if (!name || !password) {
    return NextResponse.json({ error: "Le nom et le mot de passe sont requis" }, { status: 400 });
  }

  if (mode === "signup" && !school) {
    return NextResponse.json({ error: "Le nom de l'école est requis" }, { status: 400 });
  }

  const users = await readUsers();
  const existingByName = users.find((item) => item.name.toLowerCase() === name.toLowerCase());

  if (mode === "login") {
    if (!existingByName || existingByName.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Nom ou mot de passe incorrect" }, { status: 401 });
    }
    return NextResponse.json({ user: sanitize(existingByName) });
  }

  if (existingByName) {
    return NextResponse.json({ error: "Un compte existe déjà avec ce nom" }, { status: 409 });
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    name,
    email: "",
    passwordHash: hashPassword(password),
    role,
    school,
    progress: {},
  };

  users.push(user);
  await writeUsers(users);
  return NextResponse.json({ user: sanitize(user) });
}
