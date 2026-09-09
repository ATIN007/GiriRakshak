export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://chmpdvcuwnlsxcbptmjs.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobXBkdmN1d25sc3hjYnB0bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzkzNjIsImV4cCI6MjEwNDQxNTM2Mn0.O_vcf71iw6I7QSkrIJwfbmx_JvWSaT7pLm_4KxewCNU';

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
