import { useEffect, useState } from 'react';
import { Award, Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import api from '../../api/axios';

const CATEGORIES = ['Technical', 'Design', 'Content', 'Management', 'Outreach', 'Event Operations'];

function Toast({ type, message, onClose }) {
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-lg border max-w-sm w-full ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
      <div className="flex-1">
        <p className="font-medium text-sm">{type === 'success' ? 'Contribution Logged!' : 'Error'}</p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100"><XCircle className="w-4 h-4" /></button>
    </div>
  );
}

export default function Contributions() {
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [form, setForm] = useState({ user: '', title: '', description: '', category: 'Technical', points: '' });

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));
  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 5000); };

  useEffect(() => {
    const fetchMembers = async () => {
      try { const res = await api.get('/members'); setMembers(res.data.members || []); }
      catch { /* non-fatal */ }
      finally { setMembersLoading(false); }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter((m) =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user) { showToast('error', 'Please select a member'); return; }
    setSubmitting(true);
    try {
      const body = { user: form.user, title: form.title, description: form.description, category: form.category, points: parseInt(form.points) };
      const res = await api.post('/contributions', body);
      const c = res.data.contribution;
      setRecentLogs((prev) => [c, ...prev].slice(0, 10));
      showToast('success', `Logged "${c.title}" for ${c.user?.name} (+${c.points} pts)`);
      setForm({ user: '', title: '', description: '', category: 'Technical', points: '' });
      setMemberSearch('');
    } catch (err) { showToast('error', err.response?.data?.message || 'Failed to log contribution'); }
    finally { setSubmitting(false); }
  };

  const selectedMember = members.find((m) => m._id === form.user);

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Contribution</h1>
        <p className="text-sm text-gray-500 mt-0.5">Record a member's contribution and award points</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Member</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Search member name or email..."
                  value={memberSearch}
                  onChange={(e) => { setMemberSearch(e.target.value); setForm((f) => ({ ...f, user: '' })); }} />
              </div>
              {membersLoading ? (
                <p className="text-sm text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading members...</p>
              ) : memberSearch && !selectedMember ? (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {filteredMembers.length === 0
                    ? <p className="text-sm text-gray-400 p-3">No members found</p>
                    : filteredMembers.map((m) => (
                      <button key={m._id} type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
                        onClick={() => { setForm((f) => ({ ...f, user: m._id })); setMemberSearch(m.name); }}>
                        <p className="text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email} - {m.department}</p>
                      </button>
                    ))}
                </div>
              ) : null}
              {selectedMember && (
                <div className="flex items-center gap-2 p-2.5 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="w-7 h-7 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold">{selectedMember.name?.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-primary-800">{selectedMember.name}</p><p className="text-xs text-primary-600">{selectedMember.department}</p></div>
                  <button type="button" className="ml-auto text-primary-400 hover:text-primary-700" onClick={() => { setForm((f) => ({ ...f, user: '' })); setMemberSearch(''); }}>
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div><label className="label">Contribution Title</label><input className="input" placeholder="e.g. Built the registration portal" value={form.title} onChange={set('title')} required /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Points</label><input className="input" type="number" min="0" placeholder="e.g. 15" value={form.points} onChange={set('points')} required /></div>
            </div>

            <div><label className="label">Description (optional)</label>
              <textarea className="input min-h-[80px] resize-y" placeholder="Brief description..." value={form.description} onChange={set('description')} rows={3} />
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
              <Award className="w-4 h-4 shrink-0" />
              <span>Minor contributions = 5 pts - Major contributions = 15 pts (affects activity status)</span>
            </div>

            <button type="submit" disabled={submitting || !form.user} className="btn-primary w-full justify-center py-2.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Log Contribution
            </button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Session Log</h2>
          {recentLogs.length === 0
            ? <div className="text-center py-8"><Award className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No contributions logged this session</p></div>
            : <div className="space-y-2">
              {recentLogs.map((c) => (
                <div key={c._id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{c.title}</p>
                    <span className="text-xs font-bold text-green-600 shrink-0">+{c.points}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{c.user?.name} - {c.category}</p>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
}
