import { useAppSelector } from '../app/hooks'

export function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const welcomeName = user?.email ? user.email.split('@')[0] : 'Admin'

  const summaryCards = [
    {
      label: 'Total Employees',
      value: '128',
      sub: 'Active workforce',
      icon: 'bi-people',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Pending Reviews',
      value: '24',
      sub: 'Awaiting evaluation',
      icon: 'bi-hourglass-split',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Completed Cycles',
      value: '82%',
      sub: 'Current appraisal period',
      icon: 'bi-check-circle',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'PIP Cases',
      value: '6',
      sub: 'Needs immediate attention',
      icon: 'bi-exclamation-triangle',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
  ]

  const teamProgress = [
    { name: 'Aung Ko Oo', department: 'Engineering', selfEntry: 'Completed', feedback: '4/5', score: '4.2', status: 'Finalized' },
    { name: 'Naing Ye Aung', department: 'DevOps', selfEntry: 'Completed', feedback: '3/5', score: '4.3', status: 'Finalized' },
    { name: 'Thiha Zaw', department: 'Engineering', selfEntry: 'In Progress', feedback: '3/5', score: '—', status: 'Pending' },
    { name: 'Su Mon Aye', department: 'QA', selfEntry: 'In Progress', feedback: '2/5', score: '—', status: 'Pending' },
  ]

  return (
    <div className="px-6 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-blue-700">Home</span>
            <span>/</span>
            <span className="font-medium text-slate-800">Admin Dashboard</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Welcome back, {welcomeName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Signed in as <span className="font-medium text-slate-800">{user?.role ?? 'Admin'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <i className="bi bi-calendar-plus text-sm" />
            Schedule Review
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            <i className="bi bi-plus text-sm" />
            New Appraisal Cycle
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                <i className={`bi ${card.icon} ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            <i className="bi bi-clipboard-data mr-2 text-blue-700" />
            Team Appraisal Progress
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <i className="bi bi-funnel" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Self Entry</th>
                <th className="px-5 py-3 font-semibold">360 Feedback</th>
                <th className="px-5 py-3 font-semibold">Manager Score</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamProgress.map((member) => (
                <tr key={member.name} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-800">{member.name}</td>
                  <td className="px-5 py-3 text-slate-600">{member.department}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${member.selfEntry === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {member.selfEntry}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{member.feedback}</td>
                  <td className="px-5 py-3 text-slate-700">{member.score}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${member.status === 'Finalized' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
