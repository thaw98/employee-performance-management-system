import React, { useEffect, useState } from 'react';
import axios from '../app/axiosInstance';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

export function SelfAssessmentWarning() {
    const [show, setShow] = useState(false);
    const user = useAppSelector(s => s.auth.user);

    useEffect(() => {
        if (user) {
            fetchStatus();
        }
    }, [user]);

    const fetchStatus = async () => {
        try {
            const resp = await axios.get('/self-assessments/me');
            // If no data or status is DRAFT (though our logic currently only has SUBMITTED+), show warning.
            // In our current logic, /me returns the latest. If null, they haven't started.
            if (!resp.data.data || resp.data.data.status === 'UNLOCKED') {
                setShow(true);
            } else {
                setShow(false);
            }
        } catch (err) {
            console.error('Failed to fetch self-assessment status');
        }
    };

    if (!show) return null;

    return (
        <div className="mb-6 animate-bounce-subtle">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm shadow-amber-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                    <i className="bi bi-exclamation-octagon text-2xl" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-amber-900 uppercase text-xs tracking-widest mb-1">Mandatory Action Required</h4>
                    <p className="text-sm text-amber-700">Your self-assessment form for the current appraisal cycle is incomplete. <span className="font-bold">Completion is mandatory</span> before the appraisal process can proceed.</p>
                </div>
                <Link
                    to="/hr/self-assessment"
                    className="whitespace-nowrap px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-md shadow-amber-200 active:scale-95 flex items-center gap-2"
                >
                    <span>Complete Form</span>
                    <i className="bi bi-arrow-right" />
                </Link>
            </div>
        </div>
    );
}
