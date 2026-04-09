import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Plus, Search, Navigation, History, Star, Sun, Moon, X, Check, MapPin, Move, Phone, ExternalLink, Trash2 } from 'lucide-react';
import { db } from '../db';
import type { Store } from '../db';
import { useTheme } from '../context/ThemeContext';
import AddStoreModal from '../components/AddStoreModal';
import { getRegionColor } from '../constants/regions';
import toast from 'react-hot-toast';

// Custom marker icon for saved stores, colored by region
const createStoreIcon = (isDark: boolean, region?: string) => {
  const colors = getRegionColor(region);
  const border = isDark ? 'white' : '#1a1a2e';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, ${colors.primary}, ${colors.gradient});
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid ${border};
      box-shadow: 0 4px 12px ${colors.shadow};
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 10px; height: 10px;
        background: ${border};
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Draggable placement icon (red/orange pulsing pin) for placing new store
const createPlacementIcon = () => {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 44px; height: 44px;
      position: relative;
    ">
      <div style="
        width: 44px; height: 44px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 16px rgba(239,68,68,0.6);
        display: flex; align-items: center; justify-content: center;
        animation: pinBounce 0.5s ease-out;
      ">
        <div style="
          width: 14px; height: 14px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
      <div style="
        position: absolute;
        bottom: -8px; left: 50%; 
        transform: translateX(-50%);
        width: 20px; height: 6px;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
};

// OpenStreetMap tiles with POI icons
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Heatmap Layer Component
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    
    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: '#0000ff',
        0.25: '#00bfff',
        0.5: '#00ff80',
        0.75: '#ffff00',
        1.0: '#ff0000'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

// Fly to location helper
function FlyToLocation({ location }: { location: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.flyTo(location, 17, { duration: 1.5 });
    }
  }, [location, map]);
  
  return null;
}

// Map click handler for placing new store pin
function MapClickHandler({ 
  isPlacing, 
  onMapClick 
}: { 
  isPlacing: boolean; 
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isPlacing) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function MapPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  
  // Placement mode state
  const [isPlacing, setIsPlacing] = useState(false);
  const [placementPos, setPlacementPos] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStores = useCallback(async () => {
    const allStores = await db.stores.toArray();
    setStores(allStores);
  }, []);

  useEffect(() => {
    fetchStores();
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setFlyTarget(loc);
        },
        () => console.warn("GPS not available"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [fetchStores]);

  const maxVisits = Math.max(...stores.map(s => s.visit_count), 1);
  const heatPoints: [number, number, number][] = stores.map(s => [
    s.lat, s.lng, s.visit_count / maxVisits
  ]);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Navigate using Google Maps deep link
  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // Open native Maps app (works on Android & iOS)
  const handleOpenInMaps = (lat: number, lng: number, name: string) => {
    // Try geo: URI first (Android), fallback to Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`, '_blank');
    } else {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`, '_self');
    }
  };

  // Open WhatsApp chat
  const handleWhatsApp = (waNumber: string) => {
    let clean = waNumber.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  const handleLogVisit = async (store: Store) => {
    try {
      await db.stores.update(store.id!, { visit_count: store.visit_count + 1 });
      await db.visits.add({ store_id: store.id!, visited_at: new Date().toISOString() });
      toast.success(`Kunjungan ke "${store.name}" dicatat!`);
      fetchStores();
    } catch {
      toast.error("Gagal mencatat kunjungan");
    }
  };

  const handleDeleteStore = (store: Store) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          🗑️ Hapus "{store.name}"?
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          Data kunjungan juga akan dihapus.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flex: 1, padding: '8px', borderRadius: 8,
              border: '1px solid #ddd', background: '#f5f5f5',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
            }}
          >
            Batal
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await db.visits.where('store_id').equals(store.id!).delete();
                await db.stores.delete(store.id!);
                toast.success(`"${store.name}" berhasil dihapus`);
                fetchStores();
              } catch {
                toast.error('Gagal menghapus toko');
              }
            }}
            style={{
              flex: 1, padding: '8px', borderRadius: 8,
              border: 'none', background: '#ef4444', color: 'white',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: 'top-center' });
  };

  const handleSearchSelect = (store: Store) => {
    setFlyTarget([store.lat, store.lng]);
    setSearch('');
  };

  // --- Placement mode handlers ---
  const startPlacing = () => {
    setIsPlacing(true);
    setPlacementPos(null);
    toast('📍 Ketuk peta untuk menaruh pin toko', { duration: 3000 });
  };

  const cancelPlacing = () => {
    setIsPlacing(false);
    setPlacementPos(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPlacementPos({ lat, lng });
  };

  const handlePlacementDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    setPlacementPos({ lat: pos.lat, lng: pos.lng });
  };

  const confirmPlacement = () => {
    if (placementPos) {
      setIsModalOpen(true);
    }
  };

  const handleStoreAdded = () => {
    fetchStores();
    setIsPlacing(false);
    setPlacementPos(null);
  };

  const defaultCenter: [number, number] = userLocation || [-6.200000, 106.816666];
  const placementIcon = createPlacementIcon();

  return (
    <div className="map-page-wrapper">
      {/* Search Header - hidden during placement mode */}
      {!isPlacing && (
        <div className="app-header glass glass-shadow">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Cari toko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            {search.trim() && filteredStores.length > 0 && (
              <div className="search-dropdown">
                {filteredStores.map(store => (
                  <button 
                    key={store.id}
                    onClick={() => handleSearchSelect(store)}
                    className="search-result-btn"
                  >
                    <Star size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{store.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {store.visit_count}x kunjungan
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      )}

      {/* Placement Mode Banner */}
      {isPlacing && (
        <div className="placement-banner glass glass-shadow">
          <div className="placement-banner-content">
            <MapPin size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {placementPos ? 'Geser pin ke lokasi tepat' : 'Ketuk peta untuk taruh pin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {placementPos 
                  ? `${placementPos.lat.toFixed(6)}, ${placementPos.lng.toFixed(6)}` 
                  : 'Pilih lokasi toko member di peta'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="placement-cancel-btn" onClick={cancelPlacing}>
              <X size={18} />
            </button>
            {placementPos && (
              <button className="placement-confirm-btn" onClick={confirmPlacement}>
                <Check size={18} /> Lanjut
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer 
        center={defaultCenter} 
        zoom={16} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        className={isDark ? 'map-dark-mode' : ''}
        key={theme}
      >
        <TileLayer
          attribution={OSM_ATTR}
          url={OSM_TILES}
          maxZoom={19}
        />
        <ZoomControl position="bottomleft" />
        
        <HeatmapLayer points={heatPoints} />
        <FlyToLocation location={flyTarget} />
        <MapClickHandler isPlacing={isPlacing} onMapClick={handleMapClick} />
        
        {/* Draggable placement marker */}
        {isPlacing && placementPos && (
          <Marker
            position={[placementPos.lat, placementPos.lng]}
            icon={placementIcon}
            draggable={true}
            eventHandlers={{
              dragend: handlePlacementDragEnd
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: 4, minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  📍 Pin Baru
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Geser untuk sesuaikan posisi
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Saved store markers */}
        {filteredStores.map(store => (
          <Marker 
            key={store.id} 
            position={[store.lat, store.lng]}
            icon={createStoreIcon(isDark, store.region)}
          >
            <Popup>
              <div style={{ minWidth: 220, padding: 4 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                  {store.name}
                </h3>
                
                {/* Region badge */}
                {store.region && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 12,
                    background: getRegionColor(store.region).shadow,
                    color: getRegionColor(store.region).primary,
                    fontSize: '0.7rem', fontWeight: 600,
                    marginBottom: 8,
                    border: `1px solid ${getRegionColor(store.region).primary}33`
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: getRegionColor(store.region).primary }} />
                    {store.region}
                  </div>
                )}

                {/* WhatsApp button */}
                {store.whatsapp && (
                  <button 
                    onClick={() => handleWhatsApp(store.whatsapp!)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 10px',
                      background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)',
                      borderRadius: 10, cursor: 'pointer',
                      color: '#25D366', fontSize: '0.8rem', fontWeight: 600,
                      marginBottom: 8, transition: 'background 0.2s'
                    }}
                  >
                    <Phone size={16} fill="#25D366" />
                    {store.whatsapp}
                  </button>
                )}
                
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 10
                }}>
                  <Star size={16} fill="var(--primary)" />
                  Kunjungan: {store.visit_count}x
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      onClick={() => handleLogVisit(store)}
                      className="popup-btn popup-btn-secondary"
                    >
                      <History size={14} /> Catat
                    </button>
                    <button 
                      onClick={() => handleNavigate(store.lat, store.lng)}
                      className="popup-btn popup-btn-primary"
                    >
                      <Navigation size={14} /> Arahkan
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      onClick={() => handleOpenInMaps(store.lat, store.lng, store.name)}
                      className="popup-btn popup-btn-maps"
                      style={{ flex: 1 }}
                    >
                      <ExternalLink size={14} /> Buka di Maps
                    </button>
                    <button 
                      onClick={() => handleDeleteStore(store)}
                      className="popup-btn"
                      style={{ 
                        background: 'rgba(239,68,68,0.12)', 
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                        flex: 'none',
                        padding: '8px 12px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Crosshair indicator during placement mode (before first tap) */}
      {isPlacing && !placementPos && (
        <div className="map-crosshair">
          <Move size={32} strokeWidth={1.5} />
        </div>
      )}

      {/* FAB - changes behavior based on mode */}
      {!isPlacing && (
        <button 
          className="fab"
          onClick={startPlacing}
          aria-label="Tambah Toko"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Add Store Modal - receives placement position */}
      <AddStoreModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleStoreAdded}
        defaultLocation={placementPos}
      />
    </div>
  );
}
