import Papa from "papaparse";
import { Hotel } from "@/types/hotel";

export function parseHotelsCsv(csvText: string): Hotel[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return (result.data as any[]).map((row) => ({
    region: String(row.region ?? "").trim(),
    branch_name: String(row.branch_name ?? "").trim(),
    address: String(row.address ?? "").trim(),
    rooms: Number(row.rooms ?? 0),
    latitude: null,
    longitude: null,
  }));
}
