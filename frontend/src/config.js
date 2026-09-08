export const API_BASE = 'http://localhost:8000';

export const getRiskColor = (score) => {
  if (score < 30) return '#10B981'; // Green (Low)
  if (score < 60) return '#FBBF24'; // Yellow (Moderate)
  if (score <= 80) return '#F97316'; // Orange (High)
  return '#EF4444'; // Red (Critical)
};

export const getRiskBadgeClass = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'moderate':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};
