import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [currentSociety, setCurrentSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSocieties([]);
    setCurrentSociety(null);
    localStorage.removeItem('sat_token');
    localStorage.removeItem('sat_user');
    localStorage.removeItem('sat_current_society');
    navigate('/login');
  }, [navigate]);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('sat_token');
    const storedUser = localStorage.getItem('sat_user');
    const storedSocietyId = localStorage.getItem('sat_current_society');

    if (storedToken && storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(u);

        api
          .get('/societies/my')
          .then((res) => {
            const list = res.data.societies || [];
            setSocieties(list);
            if (list.length > 0) {
              const matched = list.find((s) => s.society._id === storedSocietyId) || list[0];
              setCurrentSociety(matched);
              localStorage.setItem('sat_current_society', matched.society._id);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
        return;
      } catch {
        localStorage.removeItem('sat_token');
        localStorage.removeItem('sat_user');
      }
    }
    setLoading(false);
  }, []);

  const switchSociety = useCallback(
    (societyId) => {
      const target = societies.find((s) => s.society._id === societyId);
      if (target) {
        setCurrentSociety(target);
        localStorage.setItem('sat_current_society', target.society._id);
        navigate(target.role === 'admin' ? '/admin/dashboard' : '/member/dashboard');
      }
    },
    [societies, navigate]
  );

  const fetchSocieties = useCallback(async () => {
    try {
      const res = await api.get('/societies/my');
      const list = res.data.societies || [];
      setSocieties(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const login = useCallback(
    (newToken, newUser, initialSocieties = []) => {
      setToken(newToken);
      setUser(newUser);
      setSocieties(initialSocieties);
      localStorage.setItem('sat_token', newToken);
      localStorage.setItem('sat_user', JSON.stringify(newUser));

      if (initialSocieties.length > 0) {
        const first = initialSocieties[0];
        setCurrentSociety(first);
        localStorage.setItem('sat_current_society', first.society._id);
      }

      navigate('/select-society');
    },
    [navigate]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        societies,
        currentSociety,
        setCurrentSociety,
        switchSociety,
        fetchSocieties,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
