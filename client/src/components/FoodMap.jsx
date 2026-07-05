// client/src/components/FoodMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const createIcon = (color) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const foodIcon = createIcon('#FC8019'); 
const userIcon = createIcon('#1A1A1A'); 


export default function FoodMap({
  center,
  userLocation,
  foodPoints = [],
  onClaim,
  height = '420px',
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);


  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const initialCenter = center || userLocation || [22.7196, 75.8577];
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(initialCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); 

  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // User's own pin
    if (userLocation) {
      const marker = L.marker(userLocation, { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>Your location</strong>');
      markersRef.current.push(marker);
    }

    // Food listing pins
    foodPoints.forEach((point) => {
      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '180px';
      popupContent.style.fontFamily = 'inherit';
      popupContent.innerHTML = `
        <div style="font-weight:800; font-size:13px; color:#1A1A1A; text-transform:uppercase; margin-bottom:4px;">
          ${point.title}
        </div>
        <div style="font-size:11px; color:#888; margin-bottom:6px; text-transform:uppercase; font-weight:700;">
          ${point.foodType} · ${point.quantity}
        </div>
        ${point.providerName ? `<div style="font-size:11px; color:#555; margin-bottom:2px;">By: ${point.providerName}</div>` : ''}
        ${point.addressString ? `<div style="font-size:11px; color:#888; margin-bottom:8px;">${point.addressString}</div>` : ''}
      `;

      if (onClaim) {
        const btn = document.createElement('button');
        btn.textContent = 'Claim Surplus';
        btn.style.cssText =
          'width:100%; background:#FC8019; color:white; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:8px; border:none; cursor:pointer;';
        btn.onmouseenter = () => (btn.style.background = '#e16f11');
        btn.onmouseleave = () => (btn.style.background = '#FC8019');
        btn.onclick = () => onClaim(point.id);
        popupContent.appendChild(btn);
      }

      const marker = L.marker([point.lat, point.lng], { icon: foodIcon })
        .addTo(map)
        .bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    
    const allCoords = [
      ...(userLocation ? [userLocation] : []),
      ...foodPoints.map((p) => [p.lat, p.lng]),
    ];
    if (allCoords.length > 1) {
      map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 14 });
    } else if (allCoords.length === 1) {
      map.setView(allCoords[0], 13);
    }
  }, [foodPoints, userLocation, onClaim]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="border border-gray-200 relative z-0"
    />
  );
}