import MyRecords from './MyRecords.jsx';
import AcademicPanel from '../../components/records/AcademicPanel.jsx';

const MyAcademics = () => (
  <MyRecords title="Academic progress" subtitle="Your assessment marks, grades and semester performance." panel={AcademicPanel} />
);

export default MyAcademics;
