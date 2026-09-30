import MyRecords from './MyRecords.jsx';
import RemarkPanel from '../../components/records/RemarkPanel.jsx';

const MyRemarks = () => (
  <MyRecords title="Mentor remarks" subtitle="Feedback shared with you by your mentor." panel={RemarkPanel} />
);

export default MyRemarks;
