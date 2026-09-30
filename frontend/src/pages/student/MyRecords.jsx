import PageHeader from '../../components/PageHeader.jsx';
import { EmptyState } from '../../components/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Shared wrapper for the read-only student record pages. It resolves the
 * logged-in student's identifier and renders the matching record panel.
 */
const MyRecords = ({ title, subtitle, panel: Panel }) => {
  const { user } = useAuth();
  const studentId = user?.studentId;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      {studentId ? (
        <Panel studentId={studentId} canEdit={false} defaultSemester={user?.semester} />
      ) : (
        <EmptyState title="Records unavailable" message="Your student record could not be resolved. Please contact your administrator." />
      )}
    </>
  );
};

export default MyRecords;
