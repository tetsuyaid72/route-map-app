import { useState, useEffect } from 'react';
import { db } from '../db';
import { MapPin, Navigation, X, Phone, MapPinned } from 'lucide-react';
import toast from 'react-hot-toast';
import { REGION_OPTIONS } from '../constants/regions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLocation?: { lat: number; lng: number } | null;
}

export default function AddStoreModal({ isOpen, onClose, onSuccess, defaultLocation }: Props) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [region, setRegion] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultLocation) {
        setLat(defaultLocation.lat);
        setLng(defaultLocation.lng);
      } else {
        getLocation();
      }
    } else {
      setName('');
      setWhatsapp('');
      setRegion('');
      if (!defaultLocation) {
        setLat(null);
        setLng(null);
      }
    }
  }, [isOpen, defaultLocation]);

  const getLocation = () => {
    setLoadingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLoadingLoc(false);
          toast.success("📍 Lokasi ditemukan!");
        },
        () => {
          toast.error("Gagal mendapat GPS. Pastikan izin lokasi aktif.");
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("GPS tidak didukung di perangkat ini");
      setLoadingLoc(false);
    }
  };

  const formatWaNumber = (num: string): string => {
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama toko wajib diisi");
    if (lat === null || lng === null) return toast.error("Lokasi GPS belum didapat");

    try {
      const storeId = await db.stores.add({
        name: name.trim(),
        whatsapp: whatsapp.trim() || undefined,
        region: region.trim() || undefined,
        lat,
        lng,
        visit_count: 1,
        created_at: new Date().toISOString()
      });

      await db.visits.add({
        store_id: storeId as number,
        visited_at: new Date().toISOString()
      });

      toast.success("✅ Toko berhasil disimpan!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan toko");
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle"></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={22} style={{ color: 'var(--primary)' }} /> Tambah Toko
          </h2>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nama Toko */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Nama Toko *
            </label>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Cth: Toko Berkah Jaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Wilayah / Region - Predefined options */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPinned size={14} style={{ color: 'var(--primary)' }} />
                Wilayah / Area
              </span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {REGION_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(region === r ? '' : r)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 50,
                    border: region === r ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    background: region === r ? 'var(--primary-soft)' : 'var(--input-bg)',
                    color: region === r ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: region === r ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {region === r && '✓ '}{r}
                </button>
              ))}
            </div>
            {region && (
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: 6, fontWeight: 600 }}>
                📍 Wilayah dipilih: {region}
              </div>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={14} style={{ color: '#25D366' }} />
                Nomor WhatsApp (Opsional)
              </span>
            </label>
            <input 
              type="tel" 
              className="input-glass" 
              placeholder="Cth: 08123456789"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            {whatsapp.trim() && (
              <div style={{ 
                fontSize: '0.7rem', color: '#25D366', marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                ✓ Akan disimpan sebagai +{formatWaNumber(whatsapp)}
              </div>
            )}
          </div>

          {/* GPS Coordinates */}
          <div className="gps-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="gps-icon-wrapper">
                <Navigation size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Koordinat GPS</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {loadingLoc ? '⏳ Mencari lokasi...' : 
                   lat !== null ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : '⚠️ Belum didapat'}
                </div>
              </div>
            </div>
            {!loadingLoc && lat === null && (
              <button type="button" className="retry-btn" onClick={getLocation}>
                Coba Lagi
              </button>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>
            💾 Simpan & Tandai Kunjungan
          </button>
        </form>
      </div>
    </div>
  );
}
