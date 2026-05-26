import React, { useState } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    Lock,
    UserX,
    DownloadCloud,
    Edit3,
    UserCog,
    MapPin,
    Info,
    X,
    Filter,
    Search
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import {
    useGetSecuritySummaryQuery,
    useGetSecurityAlertsQuery,
    useGetSecurityEventsQuery,
    useGetSecurityRulesQuery,
    useGetSecurityTrendsQuery
} from '../../features/audit/securityAnalyticsApi';
import { maskNRC, maskPhone } from '../../utils/maskData';

export const SecurityAnalytics: React.FC = () => {
    const { data: summaryData, isLoading: summaryLoading } = useGetSecuritySummaryQuery();
    const { data: alertsData, isLoading: alertsLoading } = useGetSecurityAlertsQuery();
    const { data: eventsData, isLoading: eventsLoading } = useGetSecurityEventsQuery();
    const { data: rulesData, isLoading: rulesLoading } = useGetSecurityRulesQuery();
    const { data: trendsData, isLoading: trendsLoading } = useGetSecurityTrendsQuery();

    const [activeTab, setActiveTab] = useState<'alerts' | 'events' | 'rules'>('alerts');
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Mock data for UI presentation if backend is not ready
    const mockSummary = {
        criticalAlerts: 3,
        highRiskEvents: 12,
        failedLogins: 45,
        unauthorizedAccess: 5,
        sensitiveExports: 2,
        kpiChangesAfterFinal: 1,
        roleChanges: 4,
        suspiciousIps: 2
    };

    const displaySummary = summaryData || mockSummary;

    const mockTrends = [
        { date: 'Mon', count: 4, severity: 'Medium' },
        { date: 'Tue', count: 7, severity: 'High' },
        { date: 'Wed', count: 2, severity: 'Low' },
        { date: 'Thu', count: 9, severity: 'Critical' },
        { date: 'Fri', count: 5, severity: 'Medium' },
        { date: 'Sat', count: 1, severity: 'Low' },
        { date: 'Sun', count: 0, severity: 'Low' },
    ];

    const displayTrends = trendsData || mockTrends;

    const mockAlerts = [
        { id: 1, timestamp: '2026-05-26 10:15:00', alertType: 'Multiple Failed Logins', severity: 'Critical', userName: 'john.doe@example.com', userRole: 'HR', ipAddress: '192.168.1.10', module: 'Auth', affectedEmployeeName: null, description: '10 failed login attempts from same IP within 5 minutes', status: 'New', recommendedAction: 'Immediately review access and suspend the account if needed.' },
        { id: 2, timestamp: '2026-05-26 09:30:00', alertType: 'Unauthorized Access', severity: 'High', userName: 'jane.smith', userRole: 'MANAGER', ipAddress: '10.0.0.5', module: 'Performance', affectedEmployeeName: 'Alex Johnson', description: 'Manager attempted to access employee outside their department', status: 'Reviewed', recommendedAction: 'Investigate activity and confirm business justification.' }
    ];

    const displayAlerts = alertsData || mockAlerts;

    const mockEvents = [
        { id: 101, timestamp: '2026-05-26 11:20:00', userName: 'hr.admin', userRole: 'HR', ipAddress: '192.168.1.50', userAgent: 'Chrome', module: 'Employee Profile', assetType: 'Employee PII', affectedEmployeeName: 'Sarah Connor', action: 'View', description: 'HR viewed employee NRC data', riskLevel: 'Low', oldValue: null, newValue: null, detectionRule: null },
        { id: 102, timestamp: '2026-05-26 08:45:00', userName: 'audit.user', userRole: 'ROLE_AUDIT', ipAddress: '192.168.1.100', userAgent: 'Firefox', module: 'Appraisal', assetType: 'Appraisal Decision', affectedEmployeeName: 'John Doe', action: 'Export', description: 'User exported employee performance report', riskLevel: 'Medium', oldValue: null, newValue: null, detectionRule: 'Large report export' }
    ];

    const displayEvents = eventsData || mockEvents;

    const mockRules = [
        { id: 1, ruleName: 'Mass Employee Data Export', description: 'Detects when a user exports more than 50 employee records within 1 hour.', severity: 'High', status: 'Active', lastTriggered: '2026-05-25 16:00:00', triggerCount: 3 },
        { id: 2, ruleName: 'Audit Console Access Denied', description: 'Detects unauthorized attempts to access the Audit console.', severity: 'Critical', status: 'Active', lastTriggered: '2026-05-26 09:15:00', triggerCount: 12 }
    ];

    const displayRules = rulesData || mockRules;

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            case 'low': return 'bg-blue-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk.toLowerCase()) {
            case 'critical': return 'text-red-500';
            case 'high': return 'text-orange-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <ShieldAlert className="text-indigo-600" size={32} />
                    Security Analytics & Threat Detection
                </h1>
                <p className="text-slate-500 mt-2">
                    Monitor sensitive employee data access, detect suspicious activity, and identify security risks across the EPMS platform.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-red-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Critical Alerts</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.criticalAlerts}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><ShieldAlert size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">High Risk Events</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.highRiskEvents}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Lock size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Failed Logins</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.failedLogins}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><UserX size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Unauthorized Access</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.unauthorizedAccess}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><DownloadCloud size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Sensitive Exports</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.sensitiveExports}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Edit3 size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">KPI Post-Final Changes</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.kpiChangesAfterFinal}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><UserCog size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Role/Permission Changes</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.roleChanges}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><MapPin size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500">Suspicious IP Activity</p>
                        <p className="text-2xl font-bold text-slate-900">{displaySummary.suspiciousIps}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Threat Events Over Time</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Alerts by Severity</h3>
                    <div className="h-64 w-full flex items-center justify-center text-slate-500">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="severity" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-max border border-slate-200">
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'alerts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                >
                    Security Alerts
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                >
                    Sensitive Data Monitor
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'rules' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                >
                    Threat Detection Rules
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={18} />
                    <span className="text-sm font-medium">Filters:</span>
                </div>
                <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                <input type="text" placeholder="Search user or role..." className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option value="">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2 border border-indigo-200">
                    <Search size={16} /> Apply
                </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                {activeTab === 'alerts' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold">Alert Type</th>
                                    <th className="px-6 py-4 font-semibold">Severity</th>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">IP Address</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayAlerts.map((alert: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{alert.timestamp}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{alert.alertType}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">{alert.userName}</td>
                                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">{alert.userRole}</span></td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{alert.ipAddress}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedEvent({ ...alert, isAlert: true })}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-end gap-1 ml-auto"
                                            >
                                                <Info size={16} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Asset Type</th>
                                    <th className="px-6 py-4 font-semibold">Affected Employee</th>
                                    <th className="px-6 py-4 font-semibold">Action</th>
                                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayEvents.map((event: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{event.timestamp}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{event.userName}</div>
                                            <div className="text-xs text-slate-500">{event.userRole}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs">
                                                {event.assetType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{event.affectedEmployeeName || '-'}</td>
                                        <td className="px-6 py-4">{event.action}</td>
                                        <td className="px-6 py-4 font-medium flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.riskLevel).split(' ')[0]}`}></div>
                                            <span className={getRiskColor(event.riskLevel)}>{event.riskLevel}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedEvent({ ...event, isAlert: false })}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-end gap-1 ml-auto"
                                            >
                                                <Info size={16} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Rule Name</th>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold">Severity</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Last Triggered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayRules.map((rule: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{rule.ruleName}</td>
                                        <td className="px-6 py-4 text-slate-500 max-w-md">{rule.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSeverityColor(rule.severity)}`}>
                                                {rule.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs border border-emerald-200">
                                                {rule.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{rule.lastTriggered || 'Never'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {/* Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Info className="text-indigo-600" />
                                {selectedEvent.isAlert ? 'Security Alert Details' : 'Security Event Details'}
                            </h2>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(selectedEvent.severity || selectedEvent.riskLevel)}`}>
                                        {selectedEvent.severity || selectedEvent.riskLevel}
                                    </span>
                                    <span className="text-sm text-slate-500 font-mono">{selectedEvent.timestamp}</span>
                                </div>
                                <div className="text-sm font-mono text-slate-400">ID: {selectedEvent.id}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">User</p>
                                    <p className="font-medium text-slate-900">{selectedEvent.userName} <span className="text-slate-500 text-xs ml-1">({selectedEvent.userRole})</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IP Address</p>
                                    <p className="font-mono text-sm text-slate-900">{selectedEvent.ipAddress}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Module</p>
                                    <p className="font-medium text-slate-900">{selectedEvent.module}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Affected Employee</p>
                                    <p className="font-medium text-slate-900">{selectedEvent.affectedEmployeeName || 'N/A'}</p>
                                </div>
                                {selectedEvent.isAlert ? (
                                    <>
                                        <div className="col-span-2 mt-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Alert Type</p>
                                            <p className="font-medium text-slate-900">{selectedEvent.alertType}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-2 mt-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Asset & Action</p>
                                            <p className="font-medium text-slate-900">{selectedEvent.action} • {selectedEvent.assetType}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed">
                                    {selectedEvent.description}
                                </div>
                            </div>

                            {selectedEvent.isAlert && selectedEvent.recommendedAction && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recommended Action</p>
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-sm text-indigo-800 leading-relaxed flex gap-3">
                                        <Info className="shrink-0 text-indigo-600 mt-0.5" size={18} />
                                        {selectedEvent.recommendedAction}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
