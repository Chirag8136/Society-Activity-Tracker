import { useState } from 'react';
import { Eye, EyeOff, Activity, Loader2, Hash, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function LoginRegister() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    joinCode: '',
    department: '',
    position: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await api.post('/auth/login', { email: form.email, password: form.password });
      } else {
        const body = {
          name: form.name,
          email: form.email,
          password: form.password,
          joinCode: form.joinCode ? form.joinCode.trim().toUpperCase() : undefined,
          department: form.department || undefined,
          position: form.position || undefined,
        };
        res = await api.post('/auth/register', body);
      }
      const { token: newToken, user, societies } = res.data;
      login(newToken, user, societies || []);
    } catch (err) {
      console.error('Authentication Error:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : '') ||
        err.message ||
        'Authentication failed. Please verify your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/70 via-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur Spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mb-4 shadow-glow text-white">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Society Activity Tracker
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">
            Multi-tenant club &amp; society engagement platform
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 bg-white/90 backdrop-blur-xl border border-white/80 shadow-xl">
          {/* Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/60">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
              <span className="break-words">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Society Join Code (Optional)</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="input pl-9 uppercase font-mono tracking-wider font-semibold"
                      placeholder="e.g. DEV123 (or join later)"
                      value={form.joinCode}
                      onChange={set('joinCode')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Department</label>
                    <input
                      className="input"
                      placeholder="e.g. Tech"
                      value={form.department}
                      onChange={set('department')}
                    />
                  </div>
                  <div>
                    <label className="label">Position</label>
                    <input
                      className="input"
                      placeholder="e.g. Member"
                      value={form.position}
                      onChange={set('position')}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-3 text-sm shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {mode === 'login' ? 'Sign In to Portal' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs font-medium text-slate-500">
            {mode === 'login' ? "Don't have an account yet?" : 'Already registered?'}{' '}
            <button
              type="button"
              className="text-indigo-600 font-bold hover:underline"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
