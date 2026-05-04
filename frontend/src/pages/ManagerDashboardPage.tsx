import { useAppSelector } from '../app/hooks'

export function ManagerDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const welcomeName = user?.name || 'Manager'

  const summaryCards = [
    {
      label: 'Direct Reports',
      value: '8',
      sub: 'Active team members',
      icon: 'bi-people',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      label: 'Pending Team Reviews',
      value: '3',
      sub: 'Action required',
      icon: 'bi-pencil-square',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
    },
    {
      label: 'Team Progress',
      value: '65%',
      sub: 'KPI completion',
      icon: 'bi-graph-up',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Feedback Requests',
      value: '12',
      sub: 'Awaiting your input',
      icon: 'bi-chat-left-text',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
  ]

  const myTeam = [
    { name: 'Alice Smith', role: 'Frontend Dev', alignment: 'On Track', lastMeeting: '2 days ago' },
    { name: 'Bob Johnson', role: 'Backend Dev', alignment: 'At Risk', lastMeeting: 'Yesterday' },
    { name: 'Charlie Brown', role: 'QA Engineer', alignment: 'Exceeding', lastMeeting: 'Just now' },
    { name: 'Diana Prince', role: 'UX Designer', alignment: 'On Track', lastMeeting: '1 week ago' },
  ]

  return (
    <div className="px-6 py-8 md:px-10 bg-slate-50 min-h-screen">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Manager Portal
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            Welcome back, <span className="text-indigo-600">{welcomeName}</span>. How's the team doing today?
          </p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:shadow-md transition-all">
              <i className="bi bi-person-plus mr-2"></i> Add Team Member
           </button>
           <button className="px-5 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-all">
              <i className="bi bi-star mr-2"></i> Start Performance Review
           </button>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-3xl border border-white bg-white p-7 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="relative z-10">
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <i className={`bi ${card.icon} ${card.iconColor} text-2xl`} />
              </div>
              <p className="text-4xl font-black text-slate-900 leading-none mb-2">{card.value}</p>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{card.label}</h3>
              <p className="mt-3 text-xs font-semibold text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md">{card.sub}</p>
            </div>
            <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
        <div className="lg:col-span-2 rounded-3xl border border-white bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-50 px-8 py-6 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              <i className="bi bi-kanban mr-2 text-indigo-600" />
              Team Performance Tracker
            </h2>
            <button className="text-xs font-bold text-indigo-600 hover:bg-white px-3 py-1.5 rounded-lg transition-colors">View All Members</button>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-white text-left">
                <tr>
                  <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Name</th>
                  <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Role</th>
                  <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myTeam.map((member) => (
                  <tr key={member.name} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xs">{member.name[0]}</div>
                          <span className="font-bold text-slate-700">{member.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{member.role}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        member.alignment === 'Exceeding' ? 'bg-emerald-100 text-emerald-700' :
                        member.alignment === 'On Track' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {member.alignment}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button className="h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100">
                          <i className="bi bi-three-dots"></i>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-50 px-8 py-6 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
          </div>
          <div className="p-8 flex-1 space-y-6">
             {[
               { icon: 'bi-check2-circle', color: 'bg-emerald-500', text: 'You approved Alice\'s KPI setup', time: '2 hours ago' },
               { icon: 'bi-megaphone', color: 'bg-blue-500', text: '360 Feedback period started', time: '5 hours ago' },
               { icon: 'bi-exclamation-circle', color: 'bg-rose-500', text: 'Bob\'s performance meeting overdue', time: 'Yesterday' },
             ].map((log, i) => (
               <div key={i} className="flex gap-4">
                  <div className={`h-8 w-8 rounded-full ${log.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <i className={`bi ${log.icon} text-[10px]`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 leading-tight mb-1">{log.text}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                  </div>
               </div>
             ))}
          </div>
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100">
             <button className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:shadow-sm transition-all">View Analytics</button>
          </div>
        </div>
      </div>
    </div>
  )
}
