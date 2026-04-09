import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Map, Clock, BarChart2 } from 'lucide-react';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="page-container">
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Routes>
      {!isLoginPage && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
