import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db, type User } from '../db';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB and Session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Seed Accounts if empty
        const userCount = await db.users.count();
        if (userCount === 0) {
          await db.users.bulkAdd([
            {
              username: 'admin',
              password: 'admin123',
              role: 'admin',
              created_at: new Date().toISOString()
            },
            {
              username: 'driver',
              password: 'driver123',
              role: 'user',
              created_at: new Date().toISOString()
            }
          ]);
          console.log("Demo accounts seeded.");
        }

        // 2. Check existing session
        const sessionStore = localStorage.getItem('routeMap_session');
        if (sessionStore) {
          try {
            const parsedSessionData = JSON.parse(sessionStore);
            if (parsedSessionData && parsedSessionData.username) {
               // verify if user still exists
               const dbUser = await db.users.where('username').equals(parsedSessionData.username).first();
               if (dbUser) {
                 const { password, ...safeUser } = dbUser;
                 setUser(safeUser);
               } else {
                 localStorage.removeItem('routeMap_session');
               }
            }
          } catch(e) {
            localStorage.removeItem('routeMap_session');
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, passwordInput?: string) => {
    try {
      const dbUser = await db.users.where('username').equals(username.trim().toLowerCase()).first();
      
      if (!dbUser) {
        toast.error("Username tidak ditemukan");
        return false;
      }

      if (dbUser.password && dbUser.password !== passwordInput) {
        toast.error("Password salah");
        return false;
      }

      const { password, ...safeUser } = dbUser;
      setUser(safeUser);
      localStorage.setItem('routeMap_session', JSON.stringify(safeUser));
      toast.success(`Selamat datang, ${safeUser.username}!`);
      return true;

    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat login");
      return false;
    }
  };

  const register = async (username: string, passwordInput: string): Promise<boolean> => {
    try {
      const trimmed = username.trim().toLowerCase();

      if (trimmed.length < 3) {
        toast.error('Username minimal 3 karakter');
        return false;
      }

      if (passwordInput.length < 6) {
        toast.error('Password minimal 6 karakter');
        return false;
      }

      const existing = await db.users.where('username').equals(trimmed).first();
      if (existing) {
        toast.error('Username sudah digunakan');
        return false;
      }

      const newUser: Omit<User, 'id'> = {
        username: trimmed,
        password: passwordInput,
        role: 'user',
        created_at: new Date().toISOString()
      };

      const id = await db.users.add(newUser as User);
      const safeUser = { id, username: trimmed, role: 'user' as const, created_at: newUser.created_at };
      setUser(safeUser);
      localStorage.setItem('routeMap_session', JSON.stringify(safeUser));
      toast.success('Akun berhasil dibuat! Selamat datang 🎉');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat akun');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('routeMap_session');
    toast('Anda telah keluar', { icon: '👋' });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
