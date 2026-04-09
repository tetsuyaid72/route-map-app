import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import type { Store } from '../db';
import { MapPin, Navigation, Clock, TrendingUp, Phone, ExternalLink, Search, X, MapPinned, ChevronDown, ChevronUp, Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { REGION_OPTIONS } from '../constants/regions';

export default function HistoryPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'frequent'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, [sortBy]);

  const fetchHistory = async () => {
    let data = await db.stores.toArray();
    
    if (sortBy === 'recent') {
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      data.sort((a, b) => b.visit_count - a.visit_count);
    }
    
    setStores(data);
  };

  // Use only predefined regions (no "Lainnya")
  const regions = useMemo(() => {
    return [...REGION_OPTIONS] as string[];
  }, []);

  // Count stores per predefined region
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    REGION_OPTIONS.forEach(r => { counts[r] = 0; });
    stores.forEach(s => {
      if (s.region && (REGION_OPTIONS as readonly string[]).includes(s.region)) {
        counts[s.region] = (counts[s.region] || 0) + 1;
      }
    });
    return counts;
  }, [stores]);

  // Filter stores by search and region
  const filteredStores = useMemo(() => {
    let result = stores;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.region && s.region.toLowerCase().includes(q)) ||
        (s.whatsapp && s.whatsapp.includes(q))
      );
    }

    if (selectedRegion) {
      result = result.filter(s => s.region === selectedRegion);
    }

    return result;
  }, [stores, searchQuery, selectedRegion]);

  // Group stores by region
  const groupedStores = useMemo(() => {
    const groups: Record<string, Store[]> = {};
    filteredStores.forEach(store => {
      const region = store.region || 'Tanpa Wilayah';
      if (!groups[region]) groups[region] = [];
      groups[region].push(store);
    });
    return groups;
  }, [filteredStores]);

  const toggleRegionCollapse = (region: string) => {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleOpenInMaps = (lat: number, lng: number, name: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`, '_blank');
    } else {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`, '_self');
    }
  };

  const handleDelete = (store: Store) => {
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
                fetchHistory();
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

  const handleWhatsApp = (waNumber: string) => {
    let clean = waNumber.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  const regionCount = Object.keys(groupedStores).length;

  return (
    <div className="scrollable-page" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📜 Riwayat Kunjungan</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          {stores.length} toko tersimpan · {REGION_OPTIONS.length} wilayah
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={18} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-secondary)', pointerEvents: 'none'
        }} />
        <input
          type="text"
          className="input-glass"
          placeholder="Cari nama toko, wilayah, atau nomor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 42, borderRadius: 50 }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--input-bg)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Region Filter Chips - Always show predefined regions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600
        }}>
          <Layers size={14} /> FILTER WILAYAH
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
          <button
            onClick={() => setSelectedRegion(null)}
            className={`region-chip ${selectedRegion === null ? 'active' : ''}`}
          >
            Semua ({stores.length})
          </button>
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
              className={`region-chip ${selectedRegion === r ? 'active' : ''}`}
            >
              <MapPinned size={12} /> {r} ({regionCounts[r] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Sort buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button 
          className={`sort-btn ${sortBy === 'recent' ? 'active' : 'inactive'}`}
          onClick={() => setSortBy('recent')}
        >
          <Clock size={16} /> Terbaru
        </button>
        <button 
          className={`sort-btn ${sortBy === 'frequent' ? 'active' : 'inactive'}`}
          onClick={() => setSortBy('frequent')}
        >
          <TrendingUp size={16} /> Terbanyak
        </button>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div style={{ 
          fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Search size={14} /> 
          {filteredStores.length} hasil untuk "{searchQuery}"
        </div>
      )}

      {/* Store list grouped by region */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredStores.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} style={{ opacity: 0.3 }} />
            {searchQuery ? (
              <>
                <p>Tidak ada toko ditemukan.</p>
                <p style={{ fontSize: '0.8rem' }}>Coba kata kunci lain atau hapus filter wilayah.</p>
              </>
            ) : (
              <>
                <p>Belum ada riwayat kunjungan.</p>
                <p style={{ fontSize: '0.8rem' }}>Tambahkan toko pertamamu dari halaman Map!</p>
              </>
            )}
          </div>
        ) : (
          regionCount > 1 && !searchQuery ? (
            // Grouped view by region
            Object.entries(groupedStores).map(([regionName, regionStores]) => (
              <div key={regionName} className="region-group">
                <button 
                  className="region-header"
                  onClick={() => toggleRegionCollapse(regionName)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPinned size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{regionName}</span>
                    <span className="region-count">{regionStores.length}</span>
                  </div>
                  {collapsedRegions.has(regionName) ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                
                {!collapsedRegions.has(regionName) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                    {regionStores.map(store => (
                      <StoreCard
                        key={store.id}
                        store={store}
                        onNavigate={handleNavigate}
                        onOpenMaps={handleOpenInMaps}
                        onWhatsApp={handleWhatsApp}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            // Flat view (when searching or single region)
            filteredStores.map(store => (
              <StoreCard
                key={store.id}
                store={store}
                onNavigate={handleNavigate}
                onOpenMaps={handleOpenInMaps}
                onWhatsApp={handleWhatsApp}
                onDelete={handleDelete}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}

// Extracted store card component
function StoreCard({ 
  store, onNavigate, onOpenMaps, onWhatsApp, onDelete 
}: { 
  store: Store; 
  onNavigate: (lat: number, lng: number) => void;
  onOpenMaps: (lat: number, lng: number, name: string) => void;
  onWhatsApp: (wa: string) => void;
  onDelete: (store: Store) => void;
}) {
  return (
    <div className="history-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{store.name}</h3>
          <div style={{ 
            fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4,
            display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap'
          }}>
            <MapPin size={10} /> {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
            {store.region && (
              <span style={{ 
                background: 'var(--primary-soft)', color: 'var(--primary)',
                padding: '1px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600,
                marginLeft: 4
              }}>
                {store.region}
              </span>
            )}
          </div>
        </div>
        <span className="visit-badge">{store.visit_count}x</span>
      </div>
      
      {store.whatsapp && (
        <button 
          onClick={() => onWhatsApp(store.whatsapp!)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '10px 12px',
            background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)',
            borderRadius: 12, cursor: 'pointer',
            color: '#25D366', fontSize: '0.8rem', fontWeight: 600,
            transition: 'background 0.2s'
          }}
        >
          <Phone size={16} fill="#25D366" />
          {store.whatsapp}
        </button>
      )}
      
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 4, paddingTop: 10,
        borderTop: '1px solid var(--divider)'
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {formatDistanceToNow(new Date(store.created_at), { addSuffix: true, locale: id })}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => onDelete(store)}
            className="nav-btn"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={() => onOpenMaps(store.lat, store.lng, store.name)}
            className="nav-btn"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
          >
            <ExternalLink size={14} /> Maps
          </button>
          <button 
            onClick={() => onNavigate(store.lat, store.lng)}
            className="nav-btn"
          >
            <Navigation size={14} /> Navigasi
          </button>
        </div>
      </div>
    </div>
  );
}
