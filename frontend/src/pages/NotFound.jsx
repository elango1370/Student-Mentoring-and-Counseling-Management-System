import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="text-xl font-bold text-ink-900">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-500">
        The page you are looking for does not exist or you no longer have access to it.
      </p>
      <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-primary">
        {isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}
      </Link>
    </div>
  );
};

export default NotFound;
