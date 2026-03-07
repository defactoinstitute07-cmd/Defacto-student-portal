import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { User, Hash, BookOpen, Star, Wallet } from 'lucide-react';
import Skeleton from '../components/Skeleton';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      navigate('/student/login');
      return;
    }

    api.get('/student/me')
      .then(res => {
        if (res.data.success) {
          setStudent(res.data.student);
        } else {
          localStorage.removeItem('studentToken');
          navigate('/student/login');
        }
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('studentToken');
          navigate('/student/login');
        } else {
          setError('Failed to load dashboard data.');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="page-hdr" style={{ marginBottom: 20 }}>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div className="stat-card" key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="panel-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}>
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </StudentLayout>
    );
  }

  if (!student) return null;

  // Pending fees = Base Fees + Registration Fee - Fees Paid
  const pendingFees = (student.fees || 0) + (student.registrationFee || 0) - (student.feesPaid || 0);
  const overallScore = student.overallAverage || 0;

  // Dynamic Score Theme
  const getScoreTheme = (score) => {
    if (score >= 75) return { cls: 'ic-green', text: '#16a34a' }; // text-green-600
    if (score >= 60) return { cls: 'ic-orange', text: '#ca8a04' }; // text-yellow-600
    return { cls: 'ic-red', text: '#dc2626' }; // text-red-600
  };
  const scoreTheme = getScoreTheme(overallScore);

  // Dynamic Fees Theme
  const feeTheme = pendingFees === 0
    ? { cls: 'ic-green', text: '#16a34a', sub: 'All Fees Paid' }
    : { cls: 'ic-red', text: '#dc2626', sub: `₹${pendingFees.toLocaleString()} Pending` };

  const stats = [
    { label: 'Student Name', value: student.name, sub: 'Enrolled Account', icon: User, cls: 'ic-blue', valueColor: '' },
    { label: 'Roll Number', value: student.rollNo, sub: 'Unique ID', icon: Hash, cls: 'ic-indigo', valueColor: '' },
    { label: 'Class / Batch', value: student.className || student.batchName || 'N/A', sub: 'Assigned Cohort', icon: BookOpen, cls: 'ic-orange', valueColor: '' },
    { label: 'Average Score', value: `${overallScore}%`, sub: 'Overall Performance', icon: Star, cls: scoreTheme.cls, valueColor: scoreTheme.text },
    { label: 'Pending Fees', value: `₹${pendingFees.toLocaleString()}`, sub: `₹${(student.feesPaid || 0).toLocaleString()} Paid`, icon: Wallet, cls: feeTheme.cls, valueColor: feeTheme.text }
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="page-hdr" style={{ marginBottom: 20 }}>
        <h1>Student Dashboard</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Welcome back, <strong>{student.name}</strong>!
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

      {/* Stats Grid - Made fully responsive for small screens */}
      <div className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={`stat-icon ${s.cls}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: '700', color: s.valueColor || 'inherit' }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panels Section: Responsive Grid Fixed for tiny mobile screens */}
      <div className="panel-container"
        style={{
          display: 'grid',
          // Changed 300px to min(100%, 280px) so it doesn't overflow on screens smaller than 300px
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}
      >



      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;