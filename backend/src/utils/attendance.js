/**
 * Computes attendance statistics from a list of attendance documents.
 * "late" counts as present for percentage purposes; "excused" is removed
 * from the denominator, which mirrors common institutional policy.
 */
export const computeAttendanceStats = (records = []) => {
  let totalPeriods = 0;
  let attendedPeriods = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  records.forEach((r) => {
    const periods = r.periods || 1;
    if (r.status === 'excused') {
      excusedCount += 1;
      return;
    }
    totalPeriods += periods;
    if (r.status === 'present') {
      presentCount += 1;
      attendedPeriods += periods;
    } else if (r.status === 'late') {
      lateCount += 1;
      attendedPeriods += periods;
    } else {
      absentCount += 1;
    }
  });

  const percentage = totalPeriods > 0 ? Number(((attendedPeriods / totalPeriods) * 100).toFixed(2)) : 0;

  return {
    totalRecords: records.length,
    totalPeriods,
    attendedPeriods,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    percentage,
    status: percentage >= 75 ? 'good' : percentage >= 65 ? 'warning' : 'critical',
  };
};

export const groupAttendanceBySubject = (records = []) => {
  const map = new Map();
  records.forEach((r) => {
    const key = r.subjectCode;
    if (!map.has(key)) {
      map.set(key, { subjectCode: r.subjectCode, subjectName: r.subjectName, records: [] });
    }
    map.get(key).records.push(r);
  });
  return Array.from(map.values()).map((entry) => ({
    subjectCode: entry.subjectCode,
    subjectName: entry.subjectName,
    ...computeAttendanceStats(entry.records),
  }));
};

export const monthlyAttendanceTrend = (records = [], months = 6) => {
  const buckets = new Map();
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, []);
  }
  records.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key)) buckets.get(key).push(r);
  });
  return Array.from(buckets.entries()).map(([month, recs]) => ({
    month,
    label: new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    percentage: computeAttendanceStats(recs).percentage,
  }));
};
