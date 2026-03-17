import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400 }
    );
  }

  const restKey = process.env.KAKAO_REST_API_KEY;

  if (!restKey) {
    return NextResponse.json(
      { error: "KAKAO_REST_API_KEY is missing" },
      { status: 500 }
    );
  }

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${restKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "failed to fetch kakao geocode", detail: errorText },
      { status: 500 }
    );
  }

  const data = await response.json();
  const doc = data.documents?.[0];

  if (!doc) {
    return NextResponse.json({
      latitude: null,
      longitude: null,
    });
  }

  return NextResponse.json({
    latitude: Number(doc.y),
    longitude: Number(doc.x),
  });
}
