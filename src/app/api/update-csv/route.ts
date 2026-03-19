import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region, branch_name, address, rooms } = body;

    const csvPath = path.join(process.cwd(), "public", "data", "hotels.csv");
    const existing = fs.readFileSync(csvPath, "utf-8");

    const escapeCsv = (value: unknown) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const newRow = [region, branch_name, address, rooms]
      .map(escapeCsv)
      .join(",");

    const updated = existing.trimEnd() + "\n" + newRow + "\n";
    fs.writeFileSync(csvPath, updated, "utf-8");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CSV 업데이트 실패:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
