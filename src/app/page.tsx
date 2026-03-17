"use client";

import { useEffect, useMemo, useState } from "react";
import HotelMap from "@/components/HotelMap";
import { Hotel } from "@/types/hotel";
import { parseHotelsCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("전체");

  useEffect(() => {
    async function loadCsv() {
      const res = await fetch("/data/hotels.csv");
      const text = await res.text();
      const parsed = parseHotelsCsv(text);
      setHotels(parsed);
    }

    loadCsv();
  }, []);

  async function geocodeAll() {
    setLoading(true);

    const nextHotels: Hotel[] = [];

    for (const hotel of hotels) {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(hotel.address)}`
      );
      const data = await res.json();

      nextHotels.push({
        ...hotel,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }

    setHotels(nextHotels);
    setLoading(false);
  }

  async function saveToSupabase() {
    setSaving(true);

    try {
      const rows = hotels.map((hotel) => ({
        region: hotel.region,
        branch_name: hotel.branch_name,
        address: hotel.address,
        rooms: hotel.rooms,
        latitude: hotel.latitude ?? null,
        longitude: hotel.longitude ?? null,
      }));

      const { error } = await supabase
        .from("hotels")
        .upsert(rows, { onConflict: "branch_name,address" });

      if (error) {
        console.error("Supabase 저장 에러:", error);
        alert(`DB 저장 실패: ${error.message}`);
        setSaving(false);
        return;
      }

      alert(`DB 저장 완료: ${rows.length}건`);
    } catch (err) {
      console.error("예외 발생:", err);
      alert("DB 저장 중 예외가 발생했습니다.");
    }

    setSaving(false);
  }

  async function loadFromDb() {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("DB 불러오기 에러:", error);
      alert(`DB 불러오기 실패: ${error.message}`);
      return;
    }

    setHotels((data as Hotel[]) ?? []);
  }

  const regionOptions = useMemo(() => {
    const uniqueRegions = Array.from(
      new Set(hotels.map((hotel) => hotel.region).filter(Boolean))
    );
    return ["전체", ...uniqueRegions];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const matchesRegion =
        selectedRegion === "전체" || hotel.region === selectedRegion;

      const matchesKeyword =
        lowerKeyword === "" ||
        hotel.branch_name.toLowerCase().includes(lowerKeyword) ||
        hotel.address.toLowerCase().includes(lowerKeyword) ||
        hotel.region.toLowerCase().includes(lowerKeyword);

      return matchesRegion && matchesKeyword;
    });
  }, [hotels, keyword, selectedRegion]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">호텔 지도 관리</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={geocodeAll}
          className="rounded bg-black px-4 py-2 text-white"
        >
          {loading ? "좌표 변환 중..." : "전체 주소 좌표 변환"}
        </button>

        <button
          onClick={saveToSupabase}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {saving ? "DB 저장 중..." : "DB 저장"}
        </button>

        <button
          onClick={loadFromDb}
          className="rounded bg-green-700 px-4 py-2 text-white"
        >
          DB 불러오기
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="지점명, 주소, 지역 검색"
          className="w-full max-w-md rounded border px-3 py-2"
        />

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="rounded border px-3 py-2"
        >
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 text-sm text-gray-600">
        전체 {hotels.length}개 / 현재 표시 {filteredHotels.length}개
      </div>

      <HotelMap hotels={filteredHotels} />
    </main>
  );
}
