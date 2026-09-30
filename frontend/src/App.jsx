import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import NotFound from './pages/NotFound.jsx';
import Dashboard from './pages/dashboards/index.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Mentors from './pages/Mentors.jsx';
import Assignments from './pages/Assignments.jsx';
import MyStudents from './pages/MyStudents.jsx';
import ChooseStudents from './pages/ChooseStudents.jsx';
import Subjects from './pages/Subjects.jsx';
import MarksEntry from './pages/MarksEntry.jsx';
import Profile from './pages/Profile.jsx';
import MyProfile from './pages/student/MyProfile.jsx';
import MyAcademics from './pages/student/MyAcademics.jsx';
import MyAttendance from './pages/student/MyAttendance.jsx';
import MyCounseling from './pages/student/MyCounseling.jsx';
import MyRemarks from './pages/student/MyRemarks.jsx';
import MyInterventions from './pages/student/MyInterventions.jsx';

// The landing page pulls in three.js and framer-motion, so it is split into its own chunk
// and dashboard users never download it.
const Landing = lazy(() => import('./pages/Landing.jsx'));

const App = () => (
  <Routes>
    <Route
      path="/"
      element={
        <Suspense fallback={<div className="min-h-screen bg-[#050b1f]" />}>
          <Landing />
        </Suspense>
      }
    />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/resend-verification" element={<ResendVerification />} />

    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/students" element={<ProtectedRoute allow={['admin']}><Students /></ProtectedRoute>} />
      <Route path="/mentors" element={<ProtectedRoute allow={['admin']}><Mentors /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute allow={['admin']}><Assignments /></ProtectedRoute>} />

      <Route path="/my-students" element={<ProtectedRoute allow={['mentor']}><MyStudents /></ProtectedRoute>} />
      <Route path="/choose-students" element={<ProtectedRoute allow={['mentor']}><ChooseStudents /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute allow={['admin', 'mentor']}><Subjects /></ProtectedRoute>} />
      <Route path="/subjects/:id/marks" element={<ProtectedRoute allow={['admin', 'mentor']}><MarksEntry /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute allow={['admin', 'mentor']}><StudentDetail /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute allow={['admin', 'mentor']}><Profile /></ProtectedRoute>} />

      <Route path="/my-profile" element={<ProtectedRoute allow={['student']}><MyProfile /></ProtectedRoute>} />
      <Route path="/my-academics" element={<ProtectedRoute allow={['student']}><MyAcademics /></ProtectedRoute>} />
      <Route path="/my-attendance" element={<ProtectedRoute allow={['student']}><MyAttendance /></ProtectedRoute>} />
      <Route path="/my-counseling" element={<ProtectedRoute allow={['student']}><MyCounseling /></ProtectedRoute>} />
      <Route path="/my-remarks" element={<ProtectedRoute allow={['student']}><MyRemarks /></ProtectedRoute>} />
      <Route path="/my-interventions" element={<ProtectedRoute allow={['student']}><MyInterventions /></ProtectedRoute>} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
