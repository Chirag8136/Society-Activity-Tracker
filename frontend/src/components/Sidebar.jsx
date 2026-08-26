import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Award,
  QrCode,
  LogOut,
  ChevronDown,
  Building2,
  Plus,
  LogIn,
  Check,
  Grid,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateSocietyModal, JoinSocietyModal } from './SocietyModals';

export default function Sidebar() {
  const { user, societies, currentSociety, switchSociety, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const isAdmin = currentSociety?.role === 'admin';

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/events', icon: Calendar, label: 'Events & Tasks' },
    { to: '/admin/members', icon: Users, label: 'Members' },
    { to: '/admin/contributions', icon: Award, label: 'Contributions' },
  ];

  const memberLinks = [
    { to: '/member/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { to: '/check-in', icon: QrCode, label: 'Check In & Submit' },
    { to: `/profile/${user?._id}`, icon: User, label: 'My Profile & History' },
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Society Switcher Header */}
        <div className="p-3 border-b border-gray-100 relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-sm">
                {currentSociety?.society?.name?.charAt(0) || <Building2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {currentSociety?.society?.name || 'Select Society'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {currentSociety?.role || 'Member'}
                  </span>
                  {currentSociety?.society?.joinCode && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      #{currentSociety.society.joinCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                My Societies ({societies.length})
              </div>
              <div className="max-h-48 overflow-y-auto">
                {societies.map((s) => {
                  const isSelected = s.society._id === currentSociety?.society?._id;
                  return (
                    <button
                      key={s.society._id}
                      onClick={() => switchSociety(s.society._id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                        isSelected ? 'bg-primary-50/70 text-primary-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate pr-2">{s.society.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                          {s.role}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 mt-1 pt-1 space-y-0.5">
                <Link
                  to="/select-society"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  <Grid className="w-3.5 h-3.5 text-primary-600" />
                  View All Societies (Hub)
                </Link>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors text-left"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Society
                </button>
                <button
                  onClick={() => setJoinOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Join Society with Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            to="/select-society"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors mb-2 border border-gray-100"
          >
            <Grid className="w-4 h-4 text-primary-500 shrink-0" />
            <span>All Societies Hub</span>
          </Link>

          <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {currentSociety?.society?.name || 'Society Portal'}
          </div>

          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-gray-100 p-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Modals */}
      <CreateSocietyModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinSocietyModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
