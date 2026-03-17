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
};

export default function HotelMap({ hotels }: Props) {

  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    const script = document.createElement("script");

    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`;

    script.async = true;

    script.onload = () => {

      window.kakao.maps.load(() => {

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(36.5,127.8),
          level: 13
        });

        hotels.forEach((hotel) => {

          if (!hotel.latitude || !hotel.longitude) return;

          const markerPosition = new window.kakao.maps.LatLng(
            hotel.latitude,
            hotel.longitude
          );

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            map
          });

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:10px">
                <strong>${hotel.branch_name}</strong><br/>
                ${hotel.address}<br/>
                객실수: ${hotel.rooms}
              </div>`
          });

          window.kakao.maps.event.addListener(marker,"click",() => {
            infoWindow.open(map, marker);
          });

        });

      });

    };

    document.head.appendChild(script);

  }, [hotels]);

  return <div ref={mapRef} style={{width:"100%",height:"700px"}}/>;

}
