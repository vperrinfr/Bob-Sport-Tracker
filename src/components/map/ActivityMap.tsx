import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '../../types/activity';

// Fix pour les icônes Leaflet avec Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ActivityMapProps {
  activity: Activity;
  height?: string;
}

function MapBoundsUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
}

export function ActivityMap({ activity, height = '400px' }: ActivityMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Extraire toutes les positions GPS
  const positions: [number, number][] = [];
  let startPosition: [number, number] | null = null;
  let endPosition: [number, number] | null = null;

  activity.laps.forEach((lap) => {
    lap.trackpoints.forEach((tp) => {
      if (tp.latitude !== undefined && tp.longitude !== undefined) {
        const pos: [number, number] = [tp.latitude, tp.longitude];
        positions.push(pos);
        
        if (!startPosition) {
          startPosition = pos;
        }
        endPosition = pos;
      }
    });
  });

  if (positions.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p>Aucune donnée GPS disponible</p>
        </div>
      </div>
    );
  }

  // Calculer le centre de la carte
  const center: [number, number] = startPosition || [48.8566, 2.3522]; // Paris par défaut

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater positions={positions} />

        {/* Tracé du parcours */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#0ea5e9',
            weight: 4,
            opacity: 0.8,
          }}
        />

        {/* Marqueur de départ */}
        {startPosition && (
          <Marker
            position={startPosition}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: #10b981;
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                ">
                  D
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Popup>
              <strong>Départ</strong>
              <br />
              {new Date(activity.startTime).toLocaleString('fr-FR')}
            </Popup>
          </Marker>
        )}

        {/* Marqueur d'arrivée */}
        {endPosition && startPosition && endPosition !== startPosition && (
          <Marker
            position={endPosition}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background-color: #ef4444;
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                ">
                  A
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Popup>
              <strong>Arrivée</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Made with Bob