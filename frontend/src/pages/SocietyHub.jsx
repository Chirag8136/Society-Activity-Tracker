import { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  User,
  Plus,
  LogIn,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateSocietyModal, JoinSocietyModal } from '../components/SocietyModals';

export default function SocietyHub() {
  const { user, societies, switchSociety, logout } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const adminSocieties = societies.filter((s) => s.role === 'admin');
  const memberSocieties = societies.filter((s) => s.role === 'member');

  const copyJoinCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold uppercase tracking-wide">
                Society Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Welcome back, {user?.name || 'Member'}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Select a society portal to manage events, track contributions, or check in.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="btn-primary shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Create Society
            </button>
            <button
              onClick={() => setJoinOpen(true)}
              className="btn-secondary shadow-sm text-sm"
            >
              <LogIn className="w-4 h-4" /> Join with Code
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Admin Portals */}
        {adminSocieties.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Societies You Manage (Admin)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700 font-semibold">
                {adminSocieties.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adminSocieties.map((s) => (
                <div
                  key={s.society._id}
                  onClick={() => switchSociety(s.society._id)}
                  className="card p-5 bg-white hover:shadow-lg hover:border-amber-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/40 to-transparent rounded-bl-full pointer-events-none" />

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
                        {s.society.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Admin Portal
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base group-hover:text-primary-600 transition-colors">
                      {s.society.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {s.society.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Join Code:</span>
                      <button
                        onClick={(e) => copyJoinCode(s.society.joinCode, e)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-gray-700 hover:text-primary-600 bg-gray-100 px-2 py-0.5 rounded transition-colors"
                        title="Click to copy join code"
                      >
                        {s.society.joinCode}
                        {copiedCode === s.society.joinCode ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                      Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Member Portals */}
        {memberSocieties.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Societies You Joined (Member)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700 font-semibold">
                {memberSocieties.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {memberSocieties.map((s) => (
                <div
                  key={s.society._id}
                  onClick={() => switchSociety(s.society._id)}
                  className="card p-5 bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/40 to-transparent rounded-bl-full pointer-events-none" />

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                        {s.society.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Member
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base group-hover:text-primary-600 transition-colors">
                      {s.society.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.department ? `${s.department} · ` : ''}
                      {s.position || 'Member'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Category: {s.society.category || 'General'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                      Check-In &amp; Profile <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State if no societies joined yet */}
        {societies.length === 0 && (
          <div className="card p-12 text-center max-w-lg mx-auto bg-white/80 backdrop-blur-sm space-y-4">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                You haven&apos;t joined any society yet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a new society to start hosting events, or join an existing society using an invite code.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="btn-primary justify-center"
              >
                <Plus className="w-4 h-4" /> Create Society
              </button>
              <button
                onClick={() => setJoinOpen(true)}
                className="btn-secondary justify-center"
              >
                <LogIn className="w-4 h-4" /> Join with Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateSocietyModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinSocietyModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
