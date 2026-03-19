"use client";

import { useEffect, useMemo, useState } from "react";
import HotelMap from "@/components/HotelMap";
import { Hotel } from "@/types/hotel";
import { parseHotelsCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = ["미접촉", "검토중", "제안완료", "운영중", "보류"];

function extractRegionFromAddress(address: string) {
  const normalized = address.trim();

  if (normalized.startsWith("서울")) return "서울";
  if (normalized.startsWith("부산")) return "부산";
  if (normalized.startsWith("대구")) return "대구";
  if (normalized.startsWith("인천")) return "인천";
  if (normalized.startsWith("광주")) return "광주";
  if (normalized.startsWith("대전")) return "대전";
  if (normalized.startsWith("울산")) return "울산";
  if (normalized.startsWith("세종")) return "세종";
  if (normalized.startsWith("경기")) return "경기";
  if (normalized.startsWith("강원")) return "강원";
  if (normalized.startsWith("충북")) return "충북";
  if (normalized.startsWith("충남")) return "충남";
  if (normalized.startsWith("전북")) return "전북";
  if (normalized.startsWith("전남")) return "전남";
  if (normalized.startsWith("경북")) return "경북";
  if (normalized.startsWith("경남")) return "경남";
  if (normalized.startsWith("제주")) return "제주";

  if (normalized.startsWith("서울특별시")) return "서울";
  if (normalized.startsWith("부산광역시")) return "부산";
  if (normalized.startsWith("대구광역시")) return "대구";
  if (normalized.startsWith("인천광역시")) return "인천";
  if (normalized.startsWith("광주광역시")) return "광주";
  if (normalized.startsWith("대전광역시")) return "대전";
  if (normalized.startsWith("울산광역시")) return "울산";
  if (normalized.startsWith("세종특별자치시")) return "세종";
  if (normalized.startsWith("경기도")) return "경기";
  if (normalized.startsWith("강원도")) return "강원";
  if (normalized.startsWith("충청북도")) return "충북";
  if (normalized.startsWith("충청남도")) return "충남";
  if (normalized.startsWith("전라북도")) return "전북";
  if (normalized.startsWith("전라남도")) return "전남";
  if (normalized.startsWith("경상북도")) return "경북";
  if (normalized.startsWith("경상남도")) return "경남";
  if (normalized.startsWith("제주특별자치도")) return "제주";

  return "";
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "검토중":
      return "bg-blue-100 text-blue-700";
    case "제안완료":
      return "bg-purple-100 text-purple-700";
    case "운영중":
      return "bg-green-100 text-green-700";
    case "보류":
      return "bg-red-100 text-red-700";
    case "미접촉":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("전체");

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const [editBranchName, setEditBranchName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editRooms, setEditRooms] = useState("");
  const [editStatus, setEditStatus] = useState("미접촉");
  const [editMemo, setEditMemo] = useState("");

  const [newRegion, setNewRegion] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newRooms, setNewRooms] = useState("");
  const [newStatus, setNewStatus] = useState("미접촉");
  const [newMemo, setNewMemo] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function initialLoad() {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        setHotels(data as Hotel[]);
        return;
      }

      const res = await fetch("/data/hotels.csv");
      const text = await res.text();
      const parsed = parseHotelsCsv(text).map((hotel) => ({
        ...hotel,
        status: "미접촉",
        memo: "",
      }));
      setHotels(parsed);
    }

    initialLoad();
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
        region: hotel.region || extractRegionFromAddress(hotel.address),
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
        status: hotel.status ?? "미접촉",
        memo: hotel.memo ?? "",
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
    setSelectedHotel(null);
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

  function handleSelectHotel(hotel: Hotel) {
    setSelectedHotel(hotel);
    setEditBranchName(hotel.branch_name ?? "");
    setEditAddress(hotel.address ?? "");
    setEditRegion(hotel.region ?? extractRegionFromAddress(hotel.address ?? ""));
    setEditRooms(String(hotel.rooms ?? ""));
    setEditStatus(hotel.status ?? "미접촉");
    setEditMemo(hotel.memo ?? "");
  }

  async function updateSelectedHotel() {
    if (!selectedHotel?.id) {
      alert("DB에서 불러온 호텔을 선택한 뒤 수정하세요.");
      return;
    }

    const finalRegion = editRegion.trim() || extractRegionFromAddress(editAddress);
    let latitude = selectedHotel.latitude ?? null;
    let longitude = selectedHotel.longitude ?? null;

    if (editAddress.trim() !== selectedHotel.address) {
      const geocodeRes = await fetch(
        `/api/geocode?address=${encodeURIComponent(editAddress)}`
      );
      const geocodeData = await geocodeRes.json();
      latitude = geocodeData.latitude ?? null;
      longitude = geocodeData.longitude ?? null;
    }

    const { error } = await supabase
      .from("hotels")
      .update({
        branch_name: editBranchName.trim(),
        address: editAddress.trim(),
        region: finalRegion,
        rooms: Number(editRooms || 0),
        latitude,
        longitude,
        status: editStatus,
        memo: editMemo,
      })
      .eq("id", selectedHotel.id);

    if (error) {
      console.error("호텔 수정 에러:", error);
      alert(`수정 실패: ${error.message}`);
      return;
    }

    const nextHotels = hotels.map((hotel) =>
      hotel.id === selectedHotel.id
        ? {
            ...hotel,
            branch_name: editBranchName.trim(),
            address: editAddress.trim(),
            region: finalRegion,
            rooms: Number(editRooms || 0),
            latitude,
            longitude,
            status: editStatus,
            memo: editMemo,
          }
        : hotel
    );

    setHotels(nextHotels);

    const updatedHotel = {
      ...selectedHotel,
      branch_name: editBranchName.trim(),
      address: editAddress.trim(),
      region: finalRegion,
      rooms: Number(editRooms || 0),
      latitude,
      longitude,
      status: editStatus,
      memo: editMemo,
    };

    setSelectedHotel(updatedHotel);
    alert("수정 완료");
  }

  async function deleteSelectedHotel() {
    if (!selectedHotel?.id) {
      alert("DB에서 불러온 호텔을 선택한 뒤 삭제하세요.");
      return;
    }

    const confirmed = window.confirm(
      `${selectedHotel.branch_name} 호텔을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("hotels")
      .delete()
      .eq("id", selectedHotel.id);

    if (error) {
      console.error("호텔 삭제 에러:", error);
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    setHotels((prev) => prev.filter((hotel) => hotel.id !== selectedHotel.id));
    setSelectedHotel(null);
    setEditBranchName("");
    setEditAddress("");
    setEditRegion("");
    setEditRooms("");
    setEditStatus("미접촉");
    setEditMemo("");

    alert("삭제 완료");
  }

  async function createNewHotel() {
    if (!newBranchName.trim()) {
      alert("지점명을 입력하세요.");
      return;
    }

    if (!newAddress.trim()) {
      alert("주소를 입력하세요.");
      return;
    }

    setCreating(true);

    try {
      const geocodeRes = await fetch(
        `/api/geocode?address=${encodeURIComponent(newAddress)}`
      );
      const geocodeData = await geocodeRes.json();

      const latitude = geocodeData.latitude ?? null;
      const longitude = geocodeData.longitude ?? null;
      const autoRegion = extractRegionFromAddress(newAddress);

      const { data, error } = await supabase
        .from("hotels")
        .insert([
          {
            region: autoRegion || newRegion.trim(),
            branch_name: newBranchName.trim(),
            address: newAddress.trim(),
            rooms: Number(newRooms || 0),
            latitude,
            longitude,
            status: newStatus,
            memo: newMemo.trim(),
          },
        ])
        .select();

      if (error) {
        console.error("신규 호텔 등록 에러:", error);
        alert(`등록 실패: ${error.message}`);
        setCreating(false);
        return;
      }

      const createdHotel = (data?.[0] as Hotel) ?? null;

      if (createdHotel) {
        setHotels((prev) => [...prev, createdHotel]);
        handleSelectHotel(createdHotel);
      }

      await fetch("/api/update-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: autoRegion || newRegion.trim(),
          branch_name: newBranchName.trim(),
          address: newAddress.trim(),
          rooms: Number(newRooms || 0),
        }),
      });

      setNewRegion("");
      setNewBranchName("");
      setNewAddress("");
      setNewRooms("");
      setNewStatus("미접촉");
      setNewMemo("");

      alert("신규 호텔 등록 완료");
    } catch (err) {
      console.error("신규 호텔 등록 중 예외:", err);
      alert("신규 호텔 등록 중 오류가 발생했습니다.");
    }

    setCreating(false);
  }

  function downloadCsv() {
    if (hotels.length === 0) {
      alert("다운로드할 호텔 데이터가 없습니다.");
      return;
    }

    const headers = [
      "id",
      "region",
      "branch_name",
      "address",
      "rooms",
      "latitude",
      "longitude",
      "status",
      "memo",
    ];

    const escapeCsvValue = (value: unknown) => {
      const stringValue = String(value ?? "");
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = hotels.map((hotel) =>
      [
        hotel.id ?? "",
        hotel.region ?? "",
        hotel.branch_name ?? "",
        hotel.address ?? "",
        hotel.rooms ?? "",
        hotel.latitude ?? "",
        hotel.longitude ?? "",
        hotel.status ?? "",
        hotel.memo ?? "",
      ]
        .map(escapeCsvValue)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `hotels-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const selectClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500";

  const textareaClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

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

        <button
          onClick={downloadCsv}
          className="rounded bg-gray-700 px-4 py-2 text-white"
        >
          CSV 다운로드
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="지점명, 주소, 지역 검색"
          className={`max-w-md ${inputClass}`}
        />

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_2fr_1fr]">
        <aside className="rounded border p-4">
          <h2 className="mb-3 text-lg font-semibold">호텔 목록</h2>

          <div className="mb-3 text-sm text-gray-500">
            검색/필터 결과 {filteredHotels.length}개
          </div>

          <div className="max-h-[700px] space-y-2 overflow-y-auto">
            {filteredHotels.length === 0 ? (
              <div className="text-sm text-gray-500">표시할 호텔이 없습니다.</div>
            ) : (
              filteredHotels.map((hotel) => {
                const isSelected = selectedHotel?.id === hotel.id;

                return (
                  <button
                    key={`${hotel.branch_name}-${hotel.address}-${hotel.id ?? "noid"}`}
                    onClick={() => handleSelectHotel(hotel)}
                    className={`w-full rounded border p-3 text-left transition duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200 scale-[1.01]"
                        : "border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-900">
                      {hotel.branch_name}
                    </div>

                    <div className="mt-1 text-sm text-gray-700">
                      {hotel.region} · 객실수 {hotel.rooms}
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {hotel.address}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          hotel.status
                        )}`}
                      >
                        {hotel.status ?? "미접촉"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div>
          <HotelMap
            hotels={filteredHotels}
            selectedHotelId={selectedHotel?.id}
            onSelectHotel={handleSelectHotel}
          />
        </div>

        <aside className="rounded border p-4">
          <h2 className="mb-3 text-lg font-semibold">호텔 상세 / 수정</h2>

          {!selectedHotel ? (
            <p className="text-sm text-gray-500">
              지도 마커나 왼쪽 호텔 목록을 클릭하면 상세정보가 표시됩니다.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  지점명
                </label>
                <input
                  type="text"
                  value={editBranchName}
                  onChange={(e) => setEditBranchName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">주소</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => {
                    const nextAddress = e.target.value;
                    setEditAddress(nextAddress);
                    setEditRegion(extractRegionFromAddress(nextAddress));
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">지역</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  객실수
                </label>
                <input
                  type="number"
                  value={editRooms}
                  onChange={(e) => setEditRooms(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">상태</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={selectClass}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">메모</label>
                <textarea
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  rows={6}
                  className={textareaClass}
                  placeholder="호텔 관련 메모를 입력하세요"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={updateSelectedHotel}
                  className="rounded bg-purple-700 px-4 py-2 text-white"
                >
                  상세 정보 저장
                </button>

                <button
                  onClick={deleteSelectedHotel}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  호텔 삭제
                </button>
              </div>
            </div>
          )}

          <hr className="my-6" />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">신규 호텔 등록</h2>

            <div>
              <label className="mb-1 block text-sm text-gray-600">지점명</label>
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className={inputClass}
                placeholder="예: 강남점"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">주소</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => {
                  const nextAddress = e.target.value;
                  setNewAddress(nextAddress);
                  setNewRegion(extractRegionFromAddress(nextAddress));
                }}
                autoComplete="off"
                className={inputClass}
                placeholder="도로명주소 입력"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">지역</label>
              <input
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                className={inputClass}
                placeholder="주소 기반 자동 입력"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">객실수</label>
              <input
                type="number"
                value={newRooms}
                onChange={(e) => setNewRooms(e.target.value)}
                className={inputClass}
                placeholder="예: 150"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">상태</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={selectClass}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">메모</label>
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                rows={4}
                className={textareaClass}
                placeholder="신규 호텔 관련 메모 입력"
              />
            </div>

            <button
              onClick={createNewHotel}
              className="rounded bg-orange-600 px-4 py-2 text-white"
            >
              {creating ? "등록 중..." : "신규 호텔 등록"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
