import MyRecords from './MyRecords.jsx';
import AttendancePanel from '../../components/records/AttendancePanel.jsx';

const MyAttendance = () => (
  <MyRecords title="Attendance" subtitle="Your attendance percentage, subject breakdown and monthly trend." panel={AttendancePanel} />
);

export default MyAttendance;
