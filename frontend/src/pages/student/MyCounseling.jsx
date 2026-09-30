import MyRecords from './MyRecords.jsx';
import CounselingPanel from '../../components/records/CounselingPanel.jsx';

const MyCounseling = () => (
  <MyRecords title="Counseling history" subtitle="Sessions recorded by your mentor, including guidance and action plans." panel={CounselingPanel} />
);

export default MyCounseling;
