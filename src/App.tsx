import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Map, Clock, BarChart2 } from 'lucide-react';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const BottomNav = () => {
  return (
    <nav className="bottom-nav glass glass-shadow">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Map size={24} />
        <span>Map</span>
      </NavLink>
      <NavLink
        to="/history"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Clock size={24} />
        <span>Riwayat</span>
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <BarChart2 size={24} />
        <span>Statistik</span>
      </NavLink>
    </nav>
  );
};

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="page-container">
      <Routes location={location}>
        <Route path="/" element={<MapPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--bg-card-solid)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)'
            }
          }} 
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
