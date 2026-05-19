import { useState, useRef, useCallback } from 'react';
import './App.css';
import Globe from 'react-globe.gl';

interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

interface Ring {
  lat: number;
  lng: number;
}

interface Athlete {
  id: string;
  name: string;
  nationality: string;
  medal: string;
  sport: string;
  year: string;
  event: string;
  gender: string;
  result: string;
}

interface City {
  name: string;
  lat: number;
  lng: number;
}

const ARC_REL_LEN = 0.4;
const FLIGHT_TIME = 1000;
const NUM_RINGS = 3;
const RINGS_MAX_R = 5;
const RING_PROPAGATION_SPEED = 5;

export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Athens: { lat: 37.9838, lng: 23.7275 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  London: { lat: 51.5074, lng: -0.1278 },
  Stockholm: { lat: 59.3293, lng: 18.0686 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Antwerp: { lat: 51.2194, lng: 4.4025 },
  Helsinki: { lat: 60.1695, lng: 24.9354 },
  Melbourne: { lat: -37.8136, lng: 144.9631 },
  Rome: { lat: 41.9028, lng: 12.4964 },
  Tokyo: { lat: 35.6895, lng: 139.6917 },
  Munich: { lat: 48.1351, lng: 11.582 },
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Moscow: { lat: 55.7558, lng: 37.6173 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  Seoul: { lat: 37.5665, lng: 126.978 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Atlanta: { lat: 33.749, lng: -84.388 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
  Beijing: { lat: 39.9042, lng: 116.4074 },
  Rio: { lat: -22.9068, lng: -43.1729 },
  Mexico: { lat: 19.4326, lng: -99.1332 },
  Berlin: { lat: 52.52, lng: 13.405 },
};

const olympicHosts: City[] = Object.entries(cityCoordinates).map(([name, coords]) => ({
  name,
  ...coords,
}));

function App() {
  const [arcsData, setArcsData] = useState<Arc[]>([]);
  const [ringsData, setRingsData] = useState<Ring[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedal, setSelectedMedal] = useState<string>('all');
  const prevCoords = useRef<Ring>({ lat: 0, lng: 0 });
  const hasActiveResults = Boolean(selectedCity || searchQuery.trim() || selectedMedal !== 'all');

  const normalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const getMedalLabel = (medal: string) => {
    switch (medal) {
      case 'G':
        return 'gold';
      case 'S':
        return 'silver';
      case 'B':
        return 'bronze';
      default:
        return 'all medals';
    }
  };

  const handleClose = () => {
    setSelectedCity(null);
    setAthletes([]);
    setError(null);
    setSearchQuery('');
    setSelectedMedal('all');
  };

  const fetchFilteredAthletes = useCallback(async (filters: {
    city?: string;
    medal?: string;
    name?: string;
  }) => {
    setError(null);
    setIsLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const params = new URLSearchParams();

    if (filters.city) {
      params.set('city', filters.city);
    }
    if (filters.medal && filters.medal !== 'all') {
      params.set('medal', filters.medal);
    }
    if (filters.name) {
      params.set('name', filters.name);
    }

    const url = `${API_BASE_URL}/athletes/filter?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      setAthletes(data);
    } catch (err) {
      console.error('Filter Error:', err);
      setError(`Failed to load athletes: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setAthletes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const emitArc = useCallback((coords: Ring) => {
    const { lat: endLat, lng: endLng } = coords;
    const { lat: startLat, lng: startLng } = prevCoords.current;
    prevCoords.current = { lat: endLat, lng: endLng };

    const arc: Arc = { startLat, startLng, endLat, endLng };
    setArcsData(cur => [...cur, arc]);
    setTimeout(() => setArcsData(cur => cur.filter(d => d !== arc)), FLIGHT_TIME * 2);

    const srcRing: Ring = { lat: startLat, lng: startLng };
    setRingsData(cur => [...cur, srcRing]);
    setTimeout(() => setRingsData(cur => cur.filter(r => r !== srcRing)), FLIGHT_TIME * ARC_REL_LEN);

    setTimeout(() => {
      const targetRing: Ring = { lat: endLat, lng: endLng };
      setRingsData(cur => [...cur, targetRing]);
      setTimeout(() => setRingsData(cur => cur.filter(r => r !== targetRing)), FLIGHT_TIME * ARC_REL_LEN);
    }, FLIGHT_TIME);
  }, []);

  const handleCityClick = useCallback((point: object, _event?: MouseEvent, _coords?: { lat: number; lng: number; altitude: number }) => {
    const city = point as City;
    setSelectedCity(city.name);
    emitArc({ lat: city.lat, lng: city.lng });
    void fetchFilteredAthletes({
      city: city.name,
      medal: selectedMedal,
      name: searchQuery.trim() || undefined,
    });
  }, [fetchFilteredAthletes, searchQuery, selectedMedal]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      if (selectedCity) {
        void fetchFilteredAthletes({
          city: selectedCity,
          medal: selectedMedal,
        });
      } else if (selectedMedal !== 'all') {
        void fetchFilteredAthletes({
          medal: selectedMedal,
        });
      } else {
        setAthletes([]);
      }
      return;
    }
    void fetchFilteredAthletes({
      city: selectedCity || undefined,
      medal: selectedMedal,
      name: query,
    });
  };

  const handleMedalFilter = async (medal: string) => {
    setSelectedMedal(medal);
    if (selectedCity) {
      void fetchFilteredAthletes({
        city: selectedCity,
        medal,
        name: searchQuery.trim() || undefined,
      });
      return;
    }

    if (searchQuery.trim()) {
      void fetchFilteredAthletes({
        medal,
        name: searchQuery.trim(),
      });
      return;
    }

    if (medal === 'all') {
      setAthletes([]);
      return;
    }

    void fetchFilteredAthletes({ medal });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flexGrow: 1, width: 'calc(100% - 400px)' }}>
        <Globe
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          onPointClick={handleCityClick}
          arcsData={arcsData}
          arcColor={() => 'darkOrange'}
          arcDashLength={ARC_REL_LEN}
          arcDashGap={2}
          arcDashInitialGap={1}
          arcDashAnimateTime={FLIGHT_TIME}
          arcsTransitionDuration={0}
          ringsData={ringsData}
          ringColor={() => (t: number) => `rgba(255,100,50,${1 - t})`}
          ringMaxRadius={RINGS_MAX_R}
          ringPropagationSpeed={RING_PROPAGATION_SPEED}
          ringRepeatPeriod={(FLIGHT_TIME * ARC_REL_LEN) / NUM_RINGS}
          pointsData={olympicHosts}
          pointLat={(d: object) => (d as City).lat}
          pointLng={(d: object) => (d as City).lng}
          pointColor={() => '#E9DD9B'}
          pointAltitude={0.01}
          pointRadius={0.3}
          labelsData={olympicHosts}
          labelLat={(d: object) => (d as City).lat}
          labelLng={(d: object) => (d as City).lng}
          labelText={(d: object) => (d as City).name}
          labelSize={1.2}
          labelColor={() => 'white'}
          labelDotRadius={0.3}
        />
      </div>
      <div style={{
        width: '400px',
        minWidth: '400px',
        background: '#222',
        color: 'white',
        padding: '2rem',
        overflowY: 'auto',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.3)',
        flexShrink: 0,
        transform: hasActiveResults ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000
      }}>
        <button 
          className="close-button" 
          onClick={handleClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
        <h2 style={{ 
          fontSize: '1.6rem', 
          marginBottom: '1.5rem', 
          borderBottom: '2px solid #444', 
          paddingBottom: '0.5rem',
          opacity: hasActiveResults ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          paddingRight: '2rem'
        }}>
          {selectedCity
            ? `Athletes from ${selectedCity} (${athletes.length}${selectedMedal === 'all' ? '' : ` ${getMedalLabel(selectedMedal)}`})`
            : searchQuery.trim()
              ? `Search results (${athletes.length})`
              : selectedMedal !== 'all'
                ? `${getMedalLabel(selectedMedal)} medal results (${athletes.length})`
              : 'Click a city on the globe'}
        </h2>
        
        {/* Search and Filter Controls */}
        <div style={{ 
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#333',
              color: 'white',
              width: '100%',
              fontSize: '1rem'
            }}
          />
          <select
            value={selectedMedal}
            onChange={(e) => {
              setSelectedMedal(e.target.value);
              handleMedalFilter(e.target.value);
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#333',
              color: 'white',
              width: '100%',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Medals</option>
            <option value="G">Gold</option>
          <option value="S">Silver</option>
          <option value="B">Bronze</option>
          </select>
        </div>

        {isLoading && <p>Loading athletes...</p>}
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          opacity: hasActiveResults ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}>
          {!isLoading && athletes.length === 0 && hasActiveResults && <li>No athletes found.</li>}
          {athletes.map((athlete, i) => (
            <li key={i} style={{ 
              marginBottom: '1rem', 
              padding: '0.8rem', 
              background: '#333', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              opacity: 1,
              transition: 'all 0.3s ease-in-out',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <strong style={{ fontSize: '1rem' }}>{normalizeName(athlete.name)}</strong> ({athlete.nationality})<br />
              {athlete.medal} - {athlete.event} ({athlete.year})<br />
              Result: {athlete.result}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
