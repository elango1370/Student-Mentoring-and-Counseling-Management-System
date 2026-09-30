import MyRecords from './MyRecords.jsx';
import InterventionPanel from '../../components/records/InterventionPanel.jsx';

const MyInterventions = () => (
  <MyRecords title="Intervention history" subtitle="Support actions planned or taken to help your progress." panel={InterventionPanel} />
);

export default MyInterventions;
