import { useEffect, useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Plus,
  X,
  QrCode,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Award,
  CheckSquare,
  ExternalLink,
  Hourglass,
  CalendarPlus,
} from 'lucide-react';
import api from '../../api/axios';

const EVENT_TYPES = [
  'Weekly Meeting',
  'Workshop',
  'Task',
  'Event',
  'Orientation',
  'Project Meeting',
];

const DEFAULT_POINTS_MAP = {
  'Weekly Meeting': 5,
  'Project Meeting': 5,
  'Orientation': 5,
  'Workshop': 10,
  'Task': 10,
  'Event': 15,
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
const isExpired = (ev) => !ev.isActive || new Date() > new Date(ev.windowExpiresAt);

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [attendeeModal, setAttendeeModal] = useState(null);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [closingId, setClosingId] = useState(null);

  // Extend Deadline state
  const [extendModal, setExtendModal] = useState(null); // { event }
  const [extending, setExtending] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState('60');

  const [form, setForm] = useState({
    title: '',
    eventType: 'Weekly Meeting',
    date: '',
    startTime: '',
    checkInWindowMinutes: 60,
    points: 5,
  });

  const set = (f) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [f]: val };
      if (f === 'eventType' && DEFAULT_POINTS_MAP[val] !== undefined) {
        updated.points = DEFAULT_POINTS_MAP[val];
      }
      return updated;
    });
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const body = {
        title: form.title,
        eventType: form.eventType,
        date: form.date,
        checkInWindowMinutes: parseInt(form.checkInWindowMinutes) || 60,
      };
      if (form.startTime) body.startTime = form.startTime;
      if (form.points !== '') body.points = parseInt(form.points);

      const res = await api.post('/events', body);
      const newEvent = res.data.event;
      setEvents((prev) => [newEvent, ...prev]);
      setShowForm(false);
      setForm({
        title: '',
        eventType: 'Weekly Meeting',
        date: '',
        startTime: '',
        checkInWindowMinutes: 60,
        points: 5,
      });
      setQrModal({ event: newEvent });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const openAttendees = async (event) => {
    setAttendeeLoading(true);
    setAttendeeModal({ event, attendees: [], count: 0 });
    try {
      const res = await api.get(`/events/${event._id}`);
      setAttendeeModal({ event, attendees: res.data.attendees || [], count: res.data.attendeeCount });
    } catch {
      setAttendeeModal({ event, attendees: [], count: 0, error: 'Failed to load attendees' });
    } finally {
      setAttendeeLoading(false);
    }
  };

  const closeEvent = async (eventId) => {
    setClosingId(eventId);
    try {
      await api.post(`/events/${eventId}/close`);
      setEvents((prev) => prev.map((ev) => (ev._id === eventId ? { ...ev, isActive: false } : ev)));
      if (qrModal?.event?._id === eventId) setQrModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close event');
    } finally {
      setClosingId(null);
    }
  };

  const handleExtendDeadline = async (e) => {
    e.preventDefault();
    if (!extendModal?.event) return;
    setExtending(true);
    try {
      const res = await api.patch(`/events/${extendModal.event._id}/extend`, {
        extensionMinutes: parseInt(extendMinutes),
      });
      const updated = res.data.event;
      setEvents((prev) => prev.map((ev) => (ev._id === updated._id ? updated : ev)));
      setExtendModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend deadline');
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events &amp; Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Host meetings, workshops, tasks, or events with customizable point awards and deadlines
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> New Event / Task
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary-600" />
              Create Event or Task
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="e.g. Weekly Sync or Task: Submit Project Proposal"
                value={form.title}
                onChange={set('title')}
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.eventType} onChange={set('eventType')}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} ({DEFAULT_POINTS_MAP[t]} pts default)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={set('date')} required />
            </div>
            <div>
              <label className="label">Start Time (optional)</label>
              <input className="input" type="time" value={form.startTime} onChange={set('startTime')} />
            </div>
            <div>
              <label className="label">Check-in / Submission Window (minutes)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.checkInWindowMinutes}
                onChange={set('checkInWindowMinutes')}
              />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Award Points</span>
                <span className="text-xs text-primary-600 font-normal">Auto-adjusted for {form.eventType}</span>
              </label>
              <div className="relative">
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="e.g. 5, 10, 15"
                  value={form.points}
                  onChange={set('points')}
                  required
                />
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create &amp; Generate QR
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <p className="text-red-600">{error}</p>
          <button className="btn-secondary" onClick={fetchEvents}>
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No events or tasks created yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Expires / Deadline</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((ev) => {
                  const expired = isExpired(ev);
                  return (
                    <tr key={ev._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-medium">
                          {ev.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(ev.date)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <p className="font-medium text-xs text-gray-900">{formatDate(ev.windowExpiresAt)}</p>
                        <p className="text-[11px] text-gray-400">{formatTime(ev.windowExpiresAt)}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-600">+{ev.points}</td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                            <XCircle className="w-3 h-3" /> Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50"
                            title="Show QR Code & Code"
                            onClick={() => setQrModal({ event: ev })}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                            title="View Attendees & Submissions"
                            onClick={() => openAttendees(ev)}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="Extend Deadline"
                            onClick={() => setExtendModal({ event: ev })}
                          >
                            <Hourglass className="w-4 h-4" />
                          </button>
                          {!expired && (
                            <button
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                              title="Close Window Early"
                              disabled={closingId === ev._id}
                              onClick={() => closeEvent(ev._id)}
                            >
                              {closingId === ev._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 text-lg">Check-in / Task Code</h2>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800 mb-0.5">{qrModal.event.title}</p>
              <p className="text-xs text-gray-400 mb-4">
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatDate(qrModal.event.date)} · +{qrModal.event.points} pts
                {!isExpired(qrModal.event) && <span className="ml-2 text-green-600 font-bold">● Active</span>}
              </p>
              <div className="flex justify-center mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <QRCodeCanvas value={qrModal.event.checkInCode} size={180} level="M" includeMargin />
              </div>
              <p className="text-xs text-gray-400 mb-2">Or enter this code manually:</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {qrModal.event.checkInCode.split('').map((char, i) => (
                  <span
                    key={i}
                    className="w-10 h-12 flex items-center justify-center bg-primary-50 border-2 border-primary-200 rounded-lg text-xl font-bold text-primary-700 font-mono"
                  >
                    {char}
                  </span>
                ))}
              </div>
              {isExpired(qrModal.event) && (
                <div className="flex items-center gap-2 justify-center text-red-600 text-sm bg-red-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4" /> Check-in / submission window is closed
                </div>
              )}
              {!isExpired(qrModal.event) && (
                <p className="text-xs text-gray-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Expires {formatTime(qrModal.event.windowExpiresAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Extend Deadline Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Extend Deadline</h2>
                  <p className="text-xs text-gray-500">{extendModal.event.title}</p>
                </div>
              </div>
              <button onClick={() => setExtendModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600">
              Current Expiry: <strong>{new Date(extendModal.event.windowExpiresAt).toLocaleString()}</strong>
            </div>

            <form onSubmit={handleExtendDeadline} className="space-y-4">
              <div>
                <label className="label">Add Time From Now</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: '+30 Mins', value: '30' },
                    { label: '+1 Hour', value: '60' },
                    { label: '+2 Hours', value: '120' },
                    { label: '+1 Day', value: '1440' },
                    { label: '+3 Days', value: '4320' },
                    { label: '+1 Week', value: '10080' },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExtendMinutes(value)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        extendMinutes === value
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2">
                  <label className="text-[11px] text-gray-500 font-medium">Or custom minutes:</label>
                  <input
                    className="input text-sm mt-1"
                    type="number"
                    min="1"
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setExtendModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={extending} className="btn-primary">
                  {extending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Extend &amp; Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendee / Submissions Modal */}
      {attendeeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{attendeeModal.event.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold">
                    {attendeeModal.event.eventType}
                  </span>
                  <span className="text-sm text-gray-500">
                    {attendeeLoading
                      ? 'Loading...'
                      : `${attendeeModal.count} submission(s) · +${attendeeModal.event.points} pts awarded each`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                  onClick={() => openAttendees(attendeeModal.event)}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setAttendeeModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {attendeeLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : attendeeModal.error ? (
                <p className="text-red-600 text-sm text-center py-4">{attendeeModal.error}</p>
              ) : attendeeModal.attendees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No check-ins or task submissions recorded yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Member</th>
                      <th className="pb-2 font-medium">Time</th>
                      <th className="pb-2 font-medium">Deliverable / Notes</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendeeModal.attendees.map((a, i) => (
                      <tr key={a._id} className="hover:bg-gray-50 align-top">
                        <td className="py-2.5 pr-2 text-gray-400">{i + 1}</td>
                        <td className="py-2.5 pr-2">
                          <p className="font-medium text-gray-900">{a.user?.name}</p>
                          <p className="text-xs text-gray-400">{a.user?.email}</p>
                        </td>
                        <td className="py-2.5 pr-2 text-gray-500 text-xs">{formatTime(a.checkInTime)}</td>
                        <td className="py-2.5 pr-2 max-w-xs">
                          {a.submissionUrl ? (
                            <a
                              href={a.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline truncate max-w-full mb-0.5"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{a.submissionUrl}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No link attached</span>
                          )}
                          {a.submissionNotes && (
                            <p className="text-xs text-gray-600 bg-gray-50 rounded p-1.5 mt-1 border border-gray-100">
                              {a.submissionNotes}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                              a.status === 'submitted'
                                ? 'bg-purple-100 text-purple-700'
                                : a.status === 'present'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
