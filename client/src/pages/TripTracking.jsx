import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTrip } from '../api'
import { Card, Button } from '../components/ui/index'
import { ArrowLeft, MessageSquare, Phone, MapPin, Truck, CheckCircle, Clock, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { formatDateTime } from '../utils/constants'
import { useState, useEffect } from 'react'

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const truckMarkerIcon = L.divIcon({
  className: 'custom-truck-icon',
  html: `
    <div style="background: #84cc16; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(132, 204, 22, 0.5); border: 2.5px solid white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#052e16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const fetchCoordinates = async (query) => {
  try {
    const cleanQuery = query.replace(/(Depot|Hub|Warehouse|Port)/gi, '').trim()
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}`)
    const data = await res.json()
    if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch (e) {
    console.error("Geocoding failed", e)
  }
  return null
}

const fetchRoadPath = async (coordsList) => {
  try {
    const coordinatesString = coordsList.map(c => `${c[1]},${c[0]}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch(e) {
    console.error('Failed to fetch road path', e);
  }
  return coordsList;
};

export default function TripTracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [truckPos, setTruckPos] = useState(null)

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => getTrip(id),
  })

  const { data: routeCoords } = useQuery({
    queryKey: ['route-coords', trip?.source, trip?.destination],
    queryFn: async () => {
      const src = await fetchCoordinates(trip.source + ', India') || [19.0760, 72.8777]
      const dst = await fetchCoordinates(trip.destination + ', India') || [28.6139, 77.2090]
      const roadPath = await fetchRoadPath([src, dst])
      return { src, dst, roadPath }
    },
    enabled: !!trip
  })

  const { data: routeWeather } = useQuery({
    queryKey: ['weather-route', routeCoords?.src, routeCoords?.dst],
    queryFn: async () => {
      if (!routeCoords) return null;
      
      const { src, dst, roadPath } = routeCoords;
      const mid = roadPath && roadPath.length > 0 ? roadPath[Math.floor(roadPath.length / 2)] : [(src[0]+dst[0])/2, (src[1]+dst[1])/2];
      
      const lats = `${src[0]},${mid[0]},${dst[0]}`;
      const lngs = `${src[1]},${mid[1]},${dst[1]}`;
      
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`);
      let data = await res.json();
      
      if (!Array.isArray(data)) data = [data];
      
      const getWeatherDesc = (code) => {
        if (code === 0) return 'Clear';
        if (code <= 3) return 'Cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 67) return 'Rainy';
        if (code <= 77) return 'Snowy';
        if (code >= 95) return 'Stormy';
        return 'Unknown';
      };
      
      const points = data.map((d, i) => {
        const w = d.current_weather;
        return {
          location: i === 0 ? 'Source' : i === 1 ? 'Midpoint' : 'Destination',
          temp: Math.round(w.temperature),
          wind: w.windspeed,
          code: w.weathercode,
          desc: getWeatherDesc(w.weathercode)
        };
      });
      
      const hasStorm = points.some(p => p.code >= 95);
      const hasRain = points.some(p => p.code >= 51 && p.code <= 67);
      const hasFog = points.some(p => p.code === 45 || p.code === 48);
      
      let overall = 'Optimal / Clear';
      let overallColor = 'text-emerald-600 dark:text-emerald-400';
      
      if (hasStorm) {
        overall = 'Severe (Thunderstorms)';
        overallColor = 'text-red-600 dark:text-red-400';
      } else if (hasRain || hasFog) {
        overall = 'Caution (Rain/Fog)';
        overallColor = 'text-amber-600 dark:text-amber-400';
      }
      
      return { points, overall, overallColor };
    },
    enabled: !!routeCoords
  });

  useEffect(() => {
    if (!routeCoords || !trip) return;
    
    if (trip.status === 'Completed') {
      setTruckPos(routeCoords.dst);
      return;
    }
    
    if (trip.status !== 'Dispatched') {
      setTruckPos(routeCoords.src);
      return;
    }

    let start = Date.now();
    const duration = 20000; 
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      let progress = elapsed / duration;
      
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
      }
      
      const path = routeCoords.roadPath;
      if (!path || path.length < 2) return;
      
      const totalSegments = path.length - 1;
      const exactPoint = progress * totalSegments;
      const index = Math.floor(exactPoint);
      
      if (index >= totalSegments) {
        setTruckPos(path[path.length - 1]);
      } else {
        const remainder = exactPoint - index;
        const p1 = path[index];
        const p2 = path[index + 1];
        setTruckPos([
          p1[0] + (p2[0] - p1[0]) * remainder,
          p1[1] + (p2[1] - p1[1]) * remainder
        ]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [routeCoords, trip?.status]);

  if (isLoading) return <div className="p-8 text-center text-zinc-500">Loading trip tracking...</div>
  if (error || !trip) return <div className="p-8 text-center text-red-500">Failed to load trip details</div>

  const loadPercentage = trip.max_load_kg ? Math.min(100, (trip.cargo_weight_kg / trip.max_load_kg) * 100) : 0

  // Map database status to a more granular timeline
  const getTimelineSteps = () => {
    const steps = [
      { label: 'Scheduled', time: formatDateTime(trip.created_at), active: true, done: true },
      { label: 'Confirmed', time: trip.start_time ? formatDateTime(trip.start_time) : 'Pending', active: trip.status !== 'Draft', done: trip.status !== 'Draft' },
      { label: 'On Route', time: trip.status === 'Dispatched' ? 'In progress' : (trip.status === 'Completed' ? 'Done' : '—'), active: trip.status === 'Dispatched' || trip.status === 'Completed', done: trip.status === 'Completed' },
      { label: 'Arrived', time: trip.end_time ? formatDateTime(trip.end_time) : '—', active: trip.status === 'Completed', done: trip.status === 'Completed' }
    ]
    if (trip.status === 'Cancelled') {
      return [{ label: 'Scheduled', active: true, done: true }, { label: 'Cancelled', active: true, done: true, isError: true }]
    }
    return steps
  }

  const timeline = getTimelineSteps()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-soft hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Trip Tracking: #{trip.id}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{trip.source} &rarr; {trip.destination}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
            trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
            trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
            trip.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
            'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
          }`}>
            {trip.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map & Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden h-[400px] rounded-[2rem] border-zinc-200/50 dark:border-white/5 relative z-0">
            {routeCoords ? (
              <MapContainer bounds={[routeCoords.src, routeCoords.dst]} boundsOptions={{ padding: [50, 50] }} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={false} attributionControl={false}>
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri'
                />
                <Marker position={routeCoords.src} icon={customIcon}>
                  <Tooltip permanent direction="top" offset={[0, -20]} className="!bg-zinc-900 !text-white !border-zinc-700 !rounded-lg !font-medium">
                    {trip.source}
                  </Tooltip>
                </Marker>
                <Marker position={routeCoords.dst}>
                  <Tooltip permanent direction="top" offset={[0, -20]} className="!bg-zinc-900 !text-white !border-zinc-700 !rounded-lg !font-medium">
                    {trip.destination}
                  </Tooltip>
                </Marker>

                {truckPos && (
                  <Marker position={truckPos} icon={truckMarkerIcon} zIndexOffset={1000} />
                )}

                <Polyline positions={routeCoords.roadPath} pathOptions={{ color: '#84cc16', weight: 4, dashArray: trip.status === 'Dispatched' ? undefined : '10, 10' }} />
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">Loading map...</div>
            )}
          </Card>

          <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6">Order Timeline</h3>
            <div className="flex justify-between items-start relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10"></div>
              {timeline.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center w-24">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    step.isError ? 'bg-red-500 text-white' :
                    step.done ? 'bg-brand-500 text-brand-950' : 
                    step.active ? 'bg-brand-500/20 text-brand-500 border-2 border-brand-500' : 
                    'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                  }`}>
                    {step.done || step.isError ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-bold ${step.active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{step.label}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 text-center font-medium">{step.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          
          {/* Weather Visual */}
          {routeWeather && (
            <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Route Conditions</h3>
                  <p className={`text-xs font-bold mt-1 ${routeWeather.overallColor}`}>{routeWeather.overall}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {routeWeather.points.map((pt, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-white/20 dark:border-white/5">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">{pt.location}</p>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{pt.desc} • {pt.wind} km/h</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-sky-600 dark:text-sky-400">{pt.temp}°</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Truck Load Visual */}
          <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900/90 dark:to-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Current Load</h3>
            
            <div className="relative w-full max-w-sm mx-auto h-32 my-2 flex items-center justify-center">
              <svg viewBox="0 0 120 50" className="w-full h-full drop-shadow-lg text-zinc-800 dark:text-zinc-200">
                {/* Trailer Background */}
                <rect x="5" y="10" width="80" height="28" rx="2" fill="currentColor" className="opacity-10 dark:opacity-20" />
                
                {/* Fill Area (The Cargo) */}
                <clipPath id="cargo-clip">
                  <rect x="5" y="10" width="80" height="28" rx="2" />
                </clipPath>
                <rect 
                  x="5" y="10" 
                  width={80 * (loadPercentage / 100)} 
                  height="28" 
                  fill="#84cc16" 
                  clipPath="url(#cargo-clip)" 
                  className="transition-all duration-1000 ease-out" 
                />
                
                {/* Percentage Text */}
                <text x="45" y="25" fill={loadPercentage > 50 ? '#000' : 'currentColor'} fontSize="8" fontWeight="bold" textAnchor="middle" className="transition-colors delay-500">
                  {loadPercentage.toFixed(0)}% LOADED
                </text>
                
                {/* Trailer Outline */}
                <rect x="5" y="10" width="80" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="25" y1="10" x2="25" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="45" y1="10" x2="45" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="65" y1="10" x2="65" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                
                {/* Truck Cabin */}
                <path d="M85 18 L98 18 C102 18, 105 21, 105 25 L108 32 L108 38 L85 38 Z" fill="currentColor" />
                {/* Window */}
                <path d="M90 20 L96 20 C98 20, 99 22, 100 24 L102 28 L90 28 Z" fill="#fff" className="dark:fill-zinc-900" />
                
                {/* Trailer Wheels */}
                <circle cx="20" cy="40" r="5" fill="#333" className="dark:fill-black" />
                <circle cx="20" cy="40" r="2" fill="#e5e7eb" className="dark:fill-zinc-600" />
                
                <circle cx="35" cy="40" r="5" fill="#333" className="dark:fill-black" />
                <circle cx="35" cy="40" r="2" fill="#e5e7eb" className="dark:fill-zinc-600" />
                
                {/* Cabin Wheels */}
                <circle cx="95" cy="40" r="5" fill="#333" className="dark:fill-black" />
                <circle cx="95" cy="40" r="2" fill="#e5e7eb" className="dark:fill-zinc-600" />
              </svg>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Cargo</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.cargo_weight_kg} kg</p>
              </div>
              <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Max Capacity</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.max_load_kg || 'N/A'} kg</p>
              </div>
            </div>
          </Card>

          {/* Driver & Vehicle */}
          <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Truck className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{trip.driver_name}</h4>
                <p className="text-xs text-zinc-500 font-medium font-mono">{trip.vehicle_reg} • {trip.vehicle_name}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <a href={`tel:${trip.driver_contact || '+919876543210'}`} className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center hover:bg-brand-500/20 transition-colors cursor-pointer">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
