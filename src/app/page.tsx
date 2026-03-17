"use client";

import { useEffect, useState } from "react";
import HotelMap from "@/components/HotelMap";
import { Hotel } from "@/types/hotel";
import { parseHotelsCsv } from "@/lib/csv";

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    async function loadCsv() {
      const res = await fetch("/data/hotels.csv");
      const text = await res.text();
      const parsed = parseHotelsCsv(text);
      setHotels(parsed);
    }

    loadCsv();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">호텔 지도 관리</h1>
      <HotelMap hotels={hotels} />
    </main>
  );
}
