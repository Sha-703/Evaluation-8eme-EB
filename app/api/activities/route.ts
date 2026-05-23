import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const activitiesFilePath = path.join(process.cwd(), "data", "activities.json");

const readActivities = async () => {
  const content = await fs.readFile(activitiesFilePath, "utf-8");
  return JSON.parse(content) as Array<Record<string, unknown>>;
};

const writeActivities = async (activities: Array<Record<string, unknown>>) => {
  await fs.writeFile(activitiesFilePath, JSON.stringify(activities, null, 2), "utf-8");
};

export async function GET() {
  const activities = await readActivities();
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const activities = await readActivities();
  activities.push(body);
  await writeActivities(activities);
  return NextResponse.json({ ok: true });
}
