import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

import StudentDashboard from './StudentDashboard';
import StudentAttendance from './StudentAttendance';
import StudentFees from './StudentFees';
import StudentResults from './StudentResults';
import StudentSubjects from './StudentSubjects';
import StudentProfile from './StudentProfile';

const StudentTabController = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'home';

    switch (tab) {
        case 'home':
            return <StudentDashboard />;
        case 'attendance':
            return <StudentAttendance />;
        case 'fees':
            return <StudentFees />;
        case 'results':
            return <StudentResults />;
        case 'subjects':
            return <StudentSubjects />;
        case 'profile':
            return <StudentProfile />;
        default:
            return <Navigate to="/student/dashboard?tab=home" replace />;
    }
};

export default StudentTabController;
