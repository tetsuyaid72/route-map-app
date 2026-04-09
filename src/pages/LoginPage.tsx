import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Lock, LogIn, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsSubmitting(true);
    const success = await login(username, password);
    setIsSubmitting(false);
    
    if (success) {
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={`page-container login-page ${theme === 'dark' ? 'dark' : 'light'}`}>
      {/* Background elements */}
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>
      <div className="login-bg-shape shape-3"></div>

      <div className="login-content">
        <div className="login-header">
          <div className="login-logo shadow-glow">
            <MapPin size={36} color="white" strokeWidth={2.5} />
          </div>
          <h1>RouteMap</h1>
          <p>Delivery Assistant System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form glass glass-shadow rounded-2xl">
          <h2 className="form-title">Selamat Datang</h2>
          
          <div className="input-group">
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
            </div>
            <input 
              type="text" 
              className="login-input" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
            </div>
            <input 
              type="password" 
              className="login-input" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary login-btn mt-4" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : (
              <>
                <LogIn size={18} /> Masuk
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials glass">
          <div className="demo-header">
            <Info size={16} />
            <span>Info Demo Akun</span>
          </div>
          <div className="demo-accounts">
            <div className="demo-role" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
              <div className="role-name">Admin</div>
              <div className="role-creds">admin / admin123</div>
            </div>
            <div className="demo-divider"></div>
            <div className="demo-role" onClick={() => { setUsername('driver'); setPassword('driver123'); }}>
              <div className="role-name">Driver (User)</div>
              <div className="role-creds">driver / driver123</div>
            </div>
          </div>
          <p className="demo-hint">*Ketuk akun di atas untuk mengisi otomatis</p>
        </div>
      </div>
    </div>
  );
}
