import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (activeTab === 'signup') {
      if (password !== confirmPassword) {
        toast.error('Password tidak cocok!');
        return;
      }
    }

    setIsSubmitting(true);
    let success = false;

    if (activeTab === 'login') {
      success = await login(username, password);
    } else {
      success = await register(username, password);
    }

    setIsSubmitting(false);

    if (success) {
      navigate('/');
    }
  };

  const fillDemo = () => {
    setActiveTab('login');
    setUsername('admin');
    setPassword('admin123');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="login-layout-modern">
      {/* Top Gradient Area */}
      <div className="login-top-gradient"></div>

      {/* Overlapping Form Card */}
      <div className="login-bottom-card">
        
        {/* Floating Avatar Logo */}
        <div className="login-floating-avatar" onDoubleClick={fillDemo} title="Double tap to autofill demo">
          <MapPin size={32} strokeWidth={2.5} className="avatar-icon" />
        </div>

        {/* Login / Signup Toggle */}
        <div className="login-toggle-wrapper">
          <div 
            className={`login-toggle-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Login
          </div>
          <div 
            className={`login-toggle-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            Sign up
          </div>
        </div>

        <form className="login-form-modern" onSubmit={handleSubmit}>
          
          {/* Username Input */}
          <div className="modern-input-glow-wrapper">
            <div className="modern-input-inner">
              <User size={18} className="modern-input-icon" strokeWidth={2} />
              <input 
                type="text" 
                placeholder="@username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="modern-input-glow-wrapper">
            <div className="modern-input-inner">
              <Lock size={18} className="modern-input-icon" strokeWidth={2} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer', display: 'flex'}}>
                {showPassword ? (
                  <EyeOff size={18} className="modern-input-icon-right" strokeWidth={2} />
                ) : (
                  <Eye size={18} className="modern-input-icon-right" strokeWidth={2} />
                )}
              </div>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {activeTab === 'signup' && (
            <div className="modern-input-glow-wrapper">
              <div className="modern-input-inner">
                <ShieldCheck size={18} className="modern-input-icon" strokeWidth={2} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="modern-submit-btn" disabled={isSubmitting}>
            {isSubmitting 
              ? 'Memproses...' 
              : activeTab === 'login' ? 'Login' : 'Daftar'
            }
          </button>

          {/* Footer text */}
          {activeTab === 'login' ? (
            <div className="modern-forgot-link">
              Forgot Password?
            </div>
          ) : (
            <div className="modern-forgot-link">
              Akun baru akan mendapatkan role <strong>User</strong>
            </div>
          )}
          
        </form>
      </div>
    </div>
  );
}

