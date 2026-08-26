import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginRegister from './pages/auth/LoginRegister';
import SocietyHub from './pages/SocietyHub';
import Dashboard from './pages/admin/Dashboard';
import Events from './pages/admin/Events';
import Members from './pages/admin/Members';
import Contributions from './pages/admin/Contributions';
import MemberDashboard from './pages/member/MemberDashboard';
import CheckIn from './pages/member/CheckIn';
import Profile from './pages/member/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/" element={<Navigate to="/select-society" replace />} />

        {/* Central Society Selection Hub */}
        <Route
          path="/select-society"
          element={
            <ProtectedRoute>
              <SocietyHub />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="members" element={<Members />} />
          <Route path="contributions" element={<Contributions />} />
        </Route>

        {/* Member routes */}
        <Route
          path="/member"
          element={
            <ProtectedRoute role="member">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MemberDashboard />} />
        </Route>

        {/* Member Check-In */}
        <Route
          path="/check-in"
          element={
            <ProtectedRoute role="member">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CheckIn />} />
        </Route>

        {/* Profile — accessible to any authenticated user in the current society */}
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
