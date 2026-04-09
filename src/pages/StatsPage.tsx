import { useState, useEffect } from 'react';
import { db } from '../db';
import { MapPin, Target, Zap, Store, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StatsPage() {
  const [totalStores, setTotalStores] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [frequentStore, setFrequentStore] = useState('');
  const [frequentCount, setFrequentCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="scrollable-page" style={{ padding: '16px' }}>
      <div style={{ marginTop: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={24} style={{ color: '#f59e0b' }} /> Statistik
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: 4 }}>
            Ringkasan aktivitas pengiriman Anda
          </p>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="feature-card" style={{ marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Login Sedang Aktif</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{user.username} <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary)', color: 'white', borderRadius: '12px', marginLeft: '4px', verticalAlign: 'middle' }}>{user.role}</span></div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      )}

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
          Gunakan fitur <strong style={{ color: 'var(--text-primary)' }}>Heatmap</strong> pada halaman Map untuk melihat titik panas pengiriman Anda. 
          Rencanakan rute harian dari area terpadat untuk menghemat bahan bakar dan waktu!
        </p>
      </div>
    </div>
  );
}
