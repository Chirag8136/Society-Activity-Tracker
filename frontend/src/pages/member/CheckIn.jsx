import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Keyboard,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  Link as LinkIcon,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';

function Toast({ type, message, onClose }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-lg border max-w-sm w-full transition-all ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">
          {type === 'success' ? 'Success!' : 'Notice'}
        </p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CheckIn() {
  const [tab, setTab] = useState('code'); // 'code' | 'camera'
  const [code, setCode] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const scannerRef = useRef(null);
  const alreadyScanned = useRef(false);
  const SCANNER_ID = 'qr-reader';

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const submitCode = async (rawCode, url = '', notes = '') => {
    if (loading) return;
    const trimmed = rawCode.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-in', {
        code: trimmed,
        submissionUrl: url || undefined,
        submissionNotes: notes || undefined,
      });
      const ev = res.data.event;
      const isTask = ev?.eventType === 'Task';
      showToast(
        'success',
        isTask
          ? `Task "${ev?.title}" submitted successfully! (+${ev?.points || 0} pts)`
          : `Checked in to "${ev?.title || 'event'}" (+${ev?.points || 0} pts)`
      );
      setCode('');
      setSubmissionUrl('');
      setSubmissionNotes('');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Check-in or submission failed');
    } finally {
      setLoading(false);
      alreadyScanned.current = false;
    }
  };

  useEffect(() => {
    if (tab !== 'camera') {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }
    const timeout = setTimeout(() => {
      alreadyScanned.current = false;
      const scanner = new Html5QrcodeScanner(
        SCANNER_ID,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );
      scanner.render(
        (decodedText) => {
          if (alreadyScanned.current) return;
          alreadyScanned.current = true;
          submitCode(decodedText, submissionUrl, submissionNotes);
        },
        () => {}
      );
      scannerRef.current = scanner;
    }, 200);
    return () => {
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    submitCode(code, submissionUrl, submissionNotes);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event Check-In &amp; Task Submission</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Scan QR code or enter event/task code with your submission deliverable
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        {[
          { id: 'code', icon: Keyboard, label: 'Enter Code & Deliverable' },
          { id: 'camera', icon: Camera, label: 'Scan QR Code' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Camera Tab */}
      {tab === 'camera' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-primary-500" />
            <p className="text-sm font-medium text-gray-700">Point your camera at the event or task QR code</p>
          </div>
          <div id={SCANNER_ID} className="overflow-hidden rounded-lg" />
          {loading && (
            <div className="flex items-center justify-center gap-2 mt-3 text-primary-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Submitting...</span>
            </div>
          )}
        </div>
      )}

      {/* Code & Deliverables Tab */}
      {tab === 'code' && (
        <div className="card p-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="label">6-Character Event / Task Code</label>
              <input
                className="input text-center text-2xl font-mono tracking-widest uppercase py-3 font-bold"
                placeholder="e.g. HACK99"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))}
                maxLength={10}
                required
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Enter the code announced or displayed by your admin</p>
            </div>

            {/* Task Deliverable URL */}
            <div>
              <label className="label flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-primary-600" />
                <span>Deliverable Link (Optional for Tasks)</span>
              </label>
              <input
                className="input text-sm"
                type="url"
                placeholder="https://github.com/... or https://figma.com/... or Google Drive"
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Paste link to your GitHub repository, PR, Figma, or project demo
              </p>
            </div>

            {/* Task Notes */}
            <div>
              <label className="label flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary-600" />
                <span>Submission Notes / Description (Optional)</span>
              </label>
              <textarea
                className="input text-sm min-h-[70px] resize-y"
                placeholder="Briefly describe what you completed or any notes for the admin..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary w-full justify-center py-2.5 mt-2 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit &amp; Claim Points
            </button>
          </form>
        </div>
      )}

      {/* Info card */}
      <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800 space-y-1">
        <p className="font-semibold text-xs flex items-center gap-1.5 text-primary-900">
          <Sparkles className="w-3.5 h-3.5 text-primary-600" /> How Attendance &amp; Tasks Work
        </p>
        <ul className="space-y-1 text-primary-700 text-xs pl-1">
          <li>• <strong>Meetings &amp; Workshops</strong>: Scan QR or enter code to claim attendance points.</li>
          <li>• <strong>Tasks</strong>: Enter task code and attach your GitHub / Drive link to submit your work.</li>
          <li>• Points and activity scores update immediately on your profile.</li>
        </ul>
      </div>
    </div>
  );
}
