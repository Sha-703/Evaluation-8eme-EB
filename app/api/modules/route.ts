import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const modulesFilePath = path.join(process.cwd(), "data", "modules.json");

export async function GET() {
  const modules = await fs.readFile(modulesFilePath, "utf-8");
  return NextResponse.json(JSON.parse(modules));
}
