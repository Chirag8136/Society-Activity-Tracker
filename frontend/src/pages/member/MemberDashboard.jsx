import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  QrCode,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  'LOW ACTIVITY': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-700 border-red-200',
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MemberDashboard() {
  const { user, currentSociety } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?._id) return;
      setLoading(true);
      setError('');
      try {
        const [profileRes, eventsRes] = await Promise.all([
          api.get(`/members/${user._id}`),
          api.get('/events?filter=upcoming'),
        ]);
        setProfileData(profileRes.data);
        setActiveEvents(eventsRes.data.events || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load member dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-red-600 font-medium text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  const { stats, timeline } = profileData || {
    stats: {
      activityScore: 0,
      attendanceCount: 0,
      attendancePercentage: 0,
      contributionCount: 0,
      contributionPoints: 0,
      calculatedStatus: 'ACTIVE',
    },
    timeline: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                Member Portal
              </span>
              <span className="text-xs text-primary-100 font-medium">
                {currentSociety?.society?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1">Hello, {user?.name}! 👋</h1>
            <p className="text-sm text-primary-100 mt-0.5">
              {currentSociety?.department ? `${currentSociety.department} · ` : ''}
              {currentSociety?.position || 'Society Member'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/check-in"
              className="px-4 py-2.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-primary-600" />
              Check In / Submit Task
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Activity Score
            </span>
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.activityScore} <span className="text-xs text-gray-400 font-normal">pts</span>
          </p>
          <span
            className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              STATUS_STYLES[stats.calculatedStatus] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {stats.calculatedStatus}
          </span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Attendance
            </span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.attendanceCount}</p>
          <p className="text-xs text-green-600 font-medium mt-1">
            {stats.attendancePercentage}% overall attendance
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contributions &amp; Tasks
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.contributionCount}</p>
          <p className="text-xs text-purple-600 font-medium mt-1">
            +{stats.contributionPoints} contribution pts
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Attendance Pts
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            +{stats.attendancePoints} <span className="text-xs text-gray-400 font-normal">pts</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Earned via meetings &amp; workshops</p>
        </div>
      </div>

      {/* Two Column Layout: Active Events & Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Events & Tasks */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary-600" />
                Active Events &amp; Tasks
              </h2>
              <Link to="/check-in" className="text-xs font-semibold text-primary-600 hover:underline">
                Check In →
              </Link>
            </div>

            {activeEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs">No active events or tasks right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-gray-900 line-clamp-1">{ev.title}</p>
                      <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded shrink-0">
                        +{ev.points} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span>{formatDate(ev.date)}</span>
                      <span>·</span>
                      <span className="capitalize">{ev.eventType}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">
                        Code: <strong className="text-gray-900 font-bold">{ev.checkInCode}</strong>
                      </span>
                      <Link
                        to="/check-in"
                        className="text-[11px] font-bold text-primary-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Submit <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Activity Timeline */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">My Activity History</h2>
              <p className="text-xs text-gray-400">All meetings attended, missed, and contributions</p>
            </div>
            <Link
              to={`/profile/${user?._id}`}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              Full Profile →
            </Link>
          </div>

          {timeline.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {timeline.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                    entry.type === 'meeting_attended'
                      ? 'bg-green-50/50 border-green-200'
                      : entry.type === 'contribution'
                      ? 'bg-purple-50/50 border-purple-200'
                      : 'bg-red-50/40 border-red-100'
                  }`}
                >
                  <div className="mt-0.5">
                    {entry.type === 'meeting_attended' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : entry.type === 'contribution' ? (
                      <Star className="w-4 h-4 text-purple-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">{entry.title}</p>
                      <span
                        className={`font-bold shrink-0 ${
                          entry.pointsChange > 0 ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {entry.pointsChange > 0 ? `+${entry.pointsChange} pts` : '0 pts'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-gray-400 text-[11px]">
                      <span>{formatDate(entry.date)}</span>
                      <span>·</span>
                      <span className="capitalize">
                        {entry.type === 'meeting_attended'
                          ? 'Attended'
                          : entry.type === 'contribution'
                          ? entry.category || 'Contribution'
                          : 'Missed'}
                      </span>
                      <span>·</span>
                      <span>Running: {entry.runningScore} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
