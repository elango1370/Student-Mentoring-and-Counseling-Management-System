import { useAuth } from '../../context/AuthContext.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import MentorDashboard from './MentorDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';

const Dashboard = () => {
  const { role } = useAuth();
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'mentor') return <MentorDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;
