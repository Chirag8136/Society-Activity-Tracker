import { useState } from 'react';
import { X, Plus, LogIn, Loader2, Building, Hash } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Social & Outreach',
  'Arts & Media',
  'General',
];

export function CreateSocietyModal({ isOpen, onClose }) {
  const { fetchSocieties, switchSociety } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/societies', {
        name,
        category,
        description,
        code: code.trim().toUpperCase() || undefined,
      });
      const list = await fetchSocieties();
      if (res.data?.society?._id) {
        switchSociety(res.data.society._id);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create society');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">Create New Society</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Society Name</label>
            <input
              className="input"
              placeholder="e.g. Robotics & AI Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Code (optional)</label>
              <input
                className="input uppercase"
                placeholder="e.g. ROBOTICS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input min-h-[70px] resize-y"
              placeholder="What does your society do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create &amp; Become Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function JoinSocietyModal({ isOpen, onClose }) {
  const { fetchSocieties, switchSociety } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/societies/join', {
        joinCode: joinCode.trim().toUpperCase(),
        department,
        position,
      });
      await fetchSocieties();
      if (res.data?.society?._id) {
        switchSociety(res.data.society._id);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join society');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <LogIn className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">Join a Society</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">6-Character Join Code</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9 font-mono uppercase tracking-widest text-base font-bold"
                placeholder="e.g. DEV123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 10))}
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Get this code from your society administrator</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department (optional)</label>
              <input
                className="input"
                placeholder="e.g. Tech"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Position (optional)</label>
              <input
                className="input"
                placeholder="e.g. Developer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !joinCode.trim()} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Join Society
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
