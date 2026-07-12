import { useState } from 'react';
import { Card, Button, Input } from '../components/ui/index';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import { Compass, Plus, Trash2, Navigation2, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Haversine distance formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const fetchCoordinates = async (query) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}`);
    const data = await res.json();
    if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (e) {
    console.error(e);
  }
  return null;
};

// Fetch real road routing using OSRM
const fetchRoadPath = async (coordsList) => {
  try {
    const coordinatesString = coordsList.map(c => `${c[1]},${c[0]}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      // OSRM returns [lon, lat], leaflet needs [lat, lon]
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch(e) {
    console.error('Failed to fetch road path', e);
  }
  return coordsList; // fallback to straight lines
};

export default function RouteOptimizer() {
  const [stops, setStops] = useState([
    { id: 1, name: 'Mumbai', coords: [19.0760, 72.8777] },
    { id: 2, name: 'Delhi', coords: [28.6139, 77.2090] },
    { id: 3, name: 'Kolkata', coords: [22.5726, 88.3639] },
    { id: 4, name: 'Chennai', coords: [13.0827, 80.2707] }
  ]);
  const [newCity, setNewCity] = useState('');
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [roadPath, setRoadPath] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  const handleAddStop = async () => {
    if (!newCity) return;
    setIsLoadingCity(true);
    const coords = await fetchCoordinates(newCity);
    setIsLoadingCity(false);
    
    if (coords) {
      setStops([...stops, { id: Date.now(), name: newCity, coords }]);
      setNewCity('');
      setOptimizedRoute(null);
      setRoadPath(null);
    } else {
      alert('City not found');
    }
  };

  const removeStop = (id) => {
    setStops(stops.filter(s => s.id !== id));
    setOptimizedRoute(null);
    setRoadPath(null);
  };

  const optimizeRoute = () => {
    if (stops.length < 2) return;
    setIsOptimizing(true);
    
    setTimeout(() => {
      // Greedy Nearest Neighbor
      let unvisited = [...stops];
      let current = unvisited.shift(); // Start at first node
      const path = [current];
      let distSum = 0;
      
      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        
        for (let i = 0; i < unvisited.length; i++) {
          const dist = getDistance(current.coords[0], current.coords[1], unvisited[i].coords[0], unvisited[i].coords[1]);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }
        
        distSum += minDist;
        current = unvisited.splice(nearestIdx, 1)[0];
        path.push(current);
      }
      
      setTotalDistance(Math.round(distSum));
      setOptimizedRoute(path);
      
      // Fetch actual road path from OSRM
      fetchRoadPath(path.map(p => p.coords)).then(realPath => {
        setRoadPath(realPath);
        setIsOptimizing(false);
      });
    }, 800);
  };

  const displayRoute = optimizedRoute || stops;
  const polylineCoords = roadPath || displayRoute.map(s => s.coords);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">Route Optimizer</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Greedy Algorithm TSP Approximation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Stops</h3>
            
            <div className="flex gap-2 mb-6">
              <Input 
                placeholder="Add city..." 
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStop()}
              />
              <Button onClick={handleAddStop} disabled={isLoadingCity || !newCity}>
                {isLoadingCity ? '...' : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {displayRoute.map((stop, index) => (
                <div key={stop.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{stop.name}</span>
                  </div>
                  {!optimizedRoute && index !== 0 && (
                    <button onClick={() => removeStop(stop.id)} className="text-red-500 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={optimizeRoute} 
              disabled={isOptimizing || stops.length < 2 || optimizedRoute}
              className="w-full h-12 text-md font-bold"
            >
              <Navigation2 className="w-5 h-5 mr-2" />
              {isOptimizing ? 'Calculating...' : (optimizedRoute ? 'Route Optimized' : 'Run TSP Algorithm')}
            </Button>
            
            {optimizedRoute && (
              <Button onClick={() => { setOptimizedRoute(null); setRoadPath(null); }} variant="outline" className="w-full mt-3 h-12">
                Reset
              </Button>
            )}
          </Card>

          {optimizedRoute && (
            <Card className="rounded-[2rem] border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/20 text-center animate-fade-in-up">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mb-1">Optimized Distance</p>
              <p className="text-4xl font-black text-brand-700 dark:text-brand-300">{totalDistance.toLocaleString()} km</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden h-[600px] rounded-[2rem] border-zinc-200/50 dark:border-white/5 relative z-0">
            <MapContainer bounds={stops.map(s => s.coords)} boundsOptions={{ padding: [50, 50] }} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={true} attributionControl={false}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {displayRoute.map((stop, index) => (
                <Marker key={stop.id} position={stop.coords} icon={customIcon}>
                  <Tooltip permanent direction="top" offset={[0, -20]} className="!bg-zinc-900 !text-white !border-zinc-700 !rounded-lg !font-medium">
                    {index + 1}. {stop.name}
                  </Tooltip>
                </Marker>
              ))}
              
              {polylineCoords.length > 1 && (
                <Polyline 
                  positions={polylineCoords} 
                  pathOptions={{ 
                    color: optimizedRoute ? '#3b82f6' : '#9ca3af', 
                    weight: 4, 
                    dashArray: optimizedRoute ? undefined : '10, 10' 
                  }} 
                />
              )}
            </MapContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
