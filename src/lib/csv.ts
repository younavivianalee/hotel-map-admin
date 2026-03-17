import Papa from "papaparse";
import { Hotel } from "@/types/hotel";

export function parseHotelsCsv(csvText: string): Hotel[] {

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return (result.data as any[]).map((row) => ({
    region: row.region,
    branch_name: row.branch_name,
    address: row.address,
    rooms: Number(row.rooms),
    latitude: null,
    longitude: null
  }));
}
