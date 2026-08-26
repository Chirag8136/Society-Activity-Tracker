import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  Loader2,
  RefreshCw,
  UserPlus,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  X,
  Hash,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  'LOW ACTIVITY': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-500 border-gray-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function Members() {
  const { currentSociety } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/members', { params });
      setMembers(res.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(), 400);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const toggleStatus = async (userId, currentStatus) => {
    setTogglingId(userId);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/members/${userId}/status`, { status: newStatus });
      setMembers((prev) =>
        prev.map((m) => (m._id === userId ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member status');
    } finally {
      setTogglingId(null);
    }
  };

  const copyCode = () => {
    if (currentSociety?.society?.joinCode) {
      navigator.clipboard.writeText(currentSociety.society.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${members.length} registered member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
          <button className="btn-secondary" onClick={fetchMembers} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by member name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9 pr-8 min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Activity Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOW ACTIVITY">Low Activity</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <p className="text-red-600">{error}</p>
          <button className="btn-secondary" onClick={fetchMembers}>
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No members found matching your search.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Department / Role</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Contributions</th>
                  <th className="px-4 py-3 font-medium">Activity Score</th>
                  <th className="px-4 py-3 font-medium">Activity State</th>
                  <th className="px-4 py-3 font-medium">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/profile/${m._id}`}
                        className="font-medium text-primary-600 hover:underline block"
                      >
                        {m.name}
                      </Link>
                      <span className="text-xs text-gray-400">{m.email}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p className="text-sm text-gray-900">{m.department || '-'}</p>
                      <p className="text-xs text-gray-400">{m.position || 'Member'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-medium">{m.attendanceCount}</span>
                      <span className="text-gray-400 text-xs ml-1">({m.attendancePercentage}%)</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-medium">{m.contributionCount}</span>
                      <span className="text-gray-400 text-xs ml-1">(+{m.contributionPoints} pts)</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-600 text-base">
                      {m.activityScore}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.calculatedStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(m._id, m.status)}
                        disabled={togglingId === m._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                        }`}
                        title="Click to toggle member status"
                      >
                        {togglingId === m._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : m.status === 'active' ? (
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span className="capitalize">{m.status || 'active'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">Invite Members</h2>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Share this 6-character Join Code with your members. They can enter it during sign-up or from the Society Hub to join <strong>{currentSociety?.society?.name}</strong>.
            </p>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xl font-bold text-primary-700 tracking-wider">
                <Hash className="w-5 h-5 text-gray-400" />
                {currentSociety?.society?.joinCode || 'DEV123'}
              </div>
              <button onClick={copyCode} className="btn-primary text-xs py-2">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
