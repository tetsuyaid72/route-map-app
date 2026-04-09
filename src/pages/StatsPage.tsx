import { useState, useEffect } from 'react';
import { db } from '../db';
import { MapPin, Target, Zap, Store } from 'lucide-react';

export default function StatsPage() {
  const [totalStores, setTotalStores] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [frequentStore, setFrequentStore] = useState('');
  const [frequentCount, setFrequentCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const stores = await db.stores.toArray();
    setTotalStores(stores.length);
    
    const visits = await db.visits.count();
    setTotalVisits(visits);
    
    if (stores.length > 0) {
      const topStore = stores.reduce((prev, current) => 
        (prev.visit_count > current.visit_count) ? prev : current
      );
      setFrequentStore(topStore.name);
      setFrequentCount(topStore.visit_count);
    }
  };

  return (
    <div className="scrollable-page" style={{ padding: '16px' }}>
      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={24} style={{ color: '#f59e0b' }} /> Statistik
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: 4 }}>
          Ringkasan aktivitas pengiriman Anda
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="accent-bar" style={{ background: 'var(--primary)' }}></div>
          <Store size={28} style={{ color: 'var(--primary)' }} />
          <div className="stat-number">{totalStores}</div>
          <div className="stat-label">Toko Tersimpan</div>
        </div>
        
        <div className="stat-card">
          <div className="accent-bar" style={{ background: 'var(--success)' }}></div>
          <Target size={28} style={{ color: 'var(--success)' }} />
          <div className="stat-number">{totalVisits}</div>
          <div className="stat-label">Total Kunjungan</div>
        </div>
      </div>

      {/* Most visited store */}
      <div className="stat-card" style={{ textAlign: 'left', alignItems: 'stretch', marginBottom: 16 }}>
        <div className="accent-bar" style={{ background: 'var(--warning)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={22} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>Paling Sering Dikunjungi</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>
              {frequentStore || '—'}
            </div>
            {frequentCount > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginTop: 2 }}>
                {frequentCount}x kunjungan
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tips card */}
      <div className="feature-card">
        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>💡 Tips Efisiensi</h3>
        <p style={{ fontSize: '0.8rem', color: '#a0a0a0', lineHeight: 1.6 }}>
          Gunakan fitur <strong style={{ color: 'white' }}>Heatmap</strong> pada halaman Map untuk melihat titik panas pengiriman Anda. 
          Rencanakan rute harian dari area terpadat untuk menghemat bahan bakar dan waktu!
        </p>
      </div>
    </div>
  );
}
