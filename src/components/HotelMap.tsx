"use client";

import { useEffect, useRef } from "react";
import { Hotel } from "@/types/hotel";

declare global {
  interface Window {
    kakao: any;
  }
}

type Props = {
  hotels: Hotel[];
  selectedHotelId?: number;
  onSelectHotel?: (hotel: Hotel) => void;
};

export default function HotelMap({
  hotels,
  selectedHotelId,
  onSelectHotel,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const openInfoWindowRef = useRef<any>(null);
  const onSelectHotelRef = useRef(onSelectHotel);
  onSelectHotelRef.current = onSelectHotel;

  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) return;

    const renderMap = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const validHotels = hotels.filter(
          (hotel) =>
            hotel.latitude !== null &&
            hotel.latitude !== undefined &&
            hotel.longitude !== null &&
            hotel.longitude !== undefined
        );

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(36.5, 127.8),
            level: 13,
          });
        }

        const map = mapInstanceRef.current;

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        if (openInfoWindowRef.current) {
          openInfoWindowRef.current.close();
          openInfoWindowRef.current = null;
        }

        if (validHotels.length === 0) return;

        const bounds = new window.kakao.maps.LatLngBounds();

        validHotels.forEach((hotel) => {
          const position = new window.kakao.maps.LatLng(
            hotel.latitude,
            hotel.longitude
          );

          bounds.extend(position);

          const isSelected = hotel.id === selectedHotelId;

          const marker = new window.kakao.maps.Marker({
            position,
            map,
            image: new window.kakao.maps.MarkerImage(
              isSelected
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"
                : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
              new window.kakao.maps.Size(
                isSelected ? 40 : 28,
                isSelected ? 55 : 38
              )
            ),
          });

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:10px; font-size:13px; color:#111; background:#fff; border-radius:6px; line-height:1.6;">
                <strong style="font-size:14px; color:#000;">${hotel.branch_name}</strong><br/>
                <span style="color:#444;">${hotel.address}</span><br/>
                <span style="color:#555;">객실수: ${hotel.rooms}</span><br/>
                <span style="color:#1d4ed8; font-weight:600;">상태: ${hotel.status ?? "미접촉"}</span>
              </div>
            `,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
            openInfoWindowRef.current = infoWindow;
            onSelectHotelRef.current?.(hotel);
          });

          if (isSelected) {
            infoWindow.open(map, marker);
            openInfoWindowRef.current = infoWindow;
          }

          markersRef.current.push(marker);
        });

        const selectedHotel = validHotels.find(
          (hotel) => hotel.id === selectedHotelId
        );

        if (selectedHotel?.latitude && selectedHotel?.longitude) {
          const selectedPosition = new window.kakao.maps.LatLng(
            selectedHotel.latitude,
            selectedHotel.longitude
          );

          map.panTo(selectedPosition);

          window.setTimeout(() => {
            map.setLevel(4, { animate: { duration: 500 } });
          }, 250);
        } else {
          map.setBounds(bounds);
        }
      });
    };

    const existingScript = document.querySelector(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript && window.kakao) {
      renderMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    script.onload = renderMap;

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [hotels, selectedHotelId]);

  return <div ref={mapRef} style={{ width: "100%", height: "700px" }} />;
}
