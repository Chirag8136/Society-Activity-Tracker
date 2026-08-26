import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Star,
  Loader2,
  User,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  'LOW ACTIVITY': 'bg-yellow-100 text-yellow-700',
  INACTIVE: 'bg-red-100 text-red-700',
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TimelineEntry({ entry }) {
  const icons = {
    meeting_attended: <CheckCircle className="w-4 h-4 text-green-500" />,
    meeting_missed: <XCircle className="w-4 h-4 text-red-400" />,
    contribution: <Star className="w-4 h-4 text-purple-500" />,
  };
  const labels = {
    meeting_attended: 'Attended',
    meeting_missed: 'Missed Event',
    contribution: 'Contribution / Task',
  };
  const colors = {
    meeting_attended: 'border-green-200 bg-green-50/70',
    meeting_missed: 'border-red-100 bg-red-50/70',
    contribution: 'border-purple-200 bg-purple-50/70',
  };

  return (
    <div className={`flex gap-4 p-3.5 rounded-xl border ${colors[entry.type] || 'border-gray-200'}`}>
      <div className="mt-0.5">{icons[entry.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
          <span
            className={`text-sm font-bold shrink-0 ${
              entry.pointsChange > 0 ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {entry.pointsChange > 0 ? `+${entry.pointsChange} pts` : '0 pts'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-600 font-medium">{labels[entry.type]}</span>
          {entry.category && (
            <span className="text-xs px-2 py-0.5 bg-white rounded border border-purple-200 text-purple-700 font-medium">
              {entry.category}
            </span>
          )}
          {entry.attendanceStatus && (
            <span
              className={`text-xs capitalize px-2 py-0.5 rounded border font-medium ${
                entry.attendanceStatus === 'submitted'
                  ? 'bg-white border-purple-200 text-purple-700'
                  : entry.attendanceStatus === 'present'
                  ? 'bg-white border-green-200 text-green-700'
                  : 'bg-white border-yellow-200 text-yellow-700'
              }`}
            >
              {entry.attendanceStatus}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Running Score: <span className="font-bold text-gray-700">{entry.runningScore} pts</span>
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { currentSociety } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  const isAdmin = currentSociety?.role === 'admin';

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/members/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data?.member) return;
    setToggling(true);
    const newStatus = data.member.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/members/${id}/status`, { status: newStatus });
      setData((prev) => ({
        ...prev,
        member: { ...prev.member, status: newStatus },
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-600">{error}</p>
        <Link to="/admin/members" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </Link>
      </div>
    );

  const { member, stats, timeline } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={isAdmin ? '/admin/members' : '/check-in'}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> {isAdmin ? 'Back to Member Directory' : 'Back'}
        </Link>

        {isAdmin && (
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              member.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : member.status === 'active' ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
            Account Status: <span className="capitalize">{member.status || 'active'}</span>
          </button>
        )}
      </div>

      {/* Member Header Card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
            {member.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  STATUS_STYLES[stats.calculatedStatus] || 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {stats.calculatedStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              {member.department && (
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <User className="w-3 h-3 text-gray-400" />
                  {member.department}
                </span>
              )}
              {member.position && (
                <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100 font-medium">
                  {member.position}
                </span>
              )}
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                <Calendar className="w-3 h-3 text-gray-400" />
                Joined {formatDate(member.joiningDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Card Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Activity Score',
            value: `${stats.activityScore} pts`,
            icon: TrendingUp,
            color: 'text-primary-600 bg-primary-50',
          },
          {
            label: 'Attendance Count',
            value: stats.attendanceCount,
            icon: Calendar,
            color: 'text-green-600 bg-green-50',
            sub: `${stats.attendancePercentage}% attendance rate`,
          },
          {
            label: 'Attendance Points',
            value: `${stats.attendancePoints} pts`,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Contributions',
            value: stats.contributionCount,
            icon: Star,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            label: 'Contribution Points',
            value: `+${stats.contributionPoints} pts`,
            icon: Award,
            color: 'text-purple-600 bg-purple-50',
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4 text-base">Member Activity Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="space-y-2.5">
            {timeline.map((entry, i) => (
              <TimelineEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
