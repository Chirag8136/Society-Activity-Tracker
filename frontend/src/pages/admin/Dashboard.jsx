import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, UserX, TrendingUp, Medal, Loader2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const STATUS_COLORS = { ACTIVE: 'bg-green-100 text-green-700', 'LOW ACTIVITY': 'bg-yellow-100 text-yellow-700', INACTIVE: 'bg-red-100 text-red-700' };

function StatusBadge({ status }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function MetricCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '-'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatMonth(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/dashboard/stats'); setData(res.data); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-64 gap-3"><p className="text-red-600">{error}</p><button className="btn-secondary" onClick={fetchData}><RefreshCw className="w-4 h-4" /> Retry</button></div>;

  const { totalMembers, statusCounts, recentAttendanceRate, topMembers, recentContributions, monthlyTrends } = data;
  const chartData = (monthlyTrends || []).map((t) => ({ ...t, month: formatMonth(t.month) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-sm text-gray-500 mt-0.5">Society activity overview</p></div>
        <button className="btn-secondary" onClick={fetchData}><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Members" value={totalMembers} color="bg-blue-100 text-blue-600" sub={`${recentAttendanceRate}% recent attendance`} />
        <MetricCard icon={UserCheck} label="Active" value={statusCounts?.ACTIVE ?? 0} color="bg-green-100 text-green-600" />
        <MetricCard icon={AlertTriangle} label="Low Activity" value={statusCounts?.['LOW ACTIVITY'] ?? 0} color="bg-yellow-100 text-yellow-600" />
        <MetricCard icon={UserX} label="Inactive" value={statusCounts?.INACTIVE ?? 0} color="bg-red-100 text-red-600" />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-500" />Attendance and Contribution Trends (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="attendanceCount" name="Check-ins" stroke="#0ea5e9" fill="url(#attendanceGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="contributionCount" name="Contributions" stroke="#8b5cf6" fill="url(#contribGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Medal className="w-4 h-4 text-yellow-500" />Top Members</h2>
          <div className="space-y-2">
            {(topMembers || []).map((member, i) => (
              <Link key={member._id} to={`/profile/${member._id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.department}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-600">{member.activityScore} pts</p>
                  <StatusBadge status={member.calculatedStatus} />
                </div>
              </Link>
            ))}
            {(!topMembers || topMembers.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No members yet</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Contributions</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">Member</th><th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Cat.</th><th className="pb-2 font-medium text-right">Pts</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {(recentContributions || []).map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="py-2 pr-2"><Link to={`/profile/${c.user?._id}`} className="text-primary-600 hover:underline font-medium">{c.user?.name}</Link></td>
                    <td className="py-2 pr-2 text-gray-700 max-w-[120px] truncate">{c.title}</td>
                    <td className="py-2 pr-2"><span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{c.category}</span></td>
                    <td className="py-2 text-right font-semibold text-green-600">+{c.points}</td>
                  </tr>
                ))}
                {(!recentContributions || recentContributions.length === 0) && <tr><td colSpan={4} className="py-4 text-center text-gray-400">No contributions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
