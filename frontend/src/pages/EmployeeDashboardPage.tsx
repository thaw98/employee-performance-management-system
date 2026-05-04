import { useAppSelector } from '../app/hooks'
import { useNavigate } from 'react-router-dom'

export function EmployeeDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const navigate = useNavigate()
  const welcomeName = user?.name || 'Employee'

  const myStats = [
    {
      label: 'Performance Score',
      value: '4.8',
      sub: 'Top 10% this quarter',
      trend: '+0.2',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: 'bi-trophy'
    },
    {
      label: 'KPI Completion',
      value: '92%',
      sub: '5/6 tasks completed',
      trend: '+12%',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: 'bi-bullseye'
    },
    {
      label: 'Feedback Received',
      value: '18',
      sub: 'New from Manager',
      trend: 'New',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: 'bi-chat-heart'
    },
    {
      label: 'Days in Period',
      value: '42',
      sub: '18 days remaining',
      trend: '-2',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: 'bi-calendar3'
    }
  ]

  return (
    <div className="px-6 py-8 md:px-10 bg-slate-50 min-h-screen text-slate-800">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2 block">Employee Experience</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            Hello, {welcomeName} 👋
          </h1>
          <p className="text-slate-500 font-bold max-w-md">
            Your performance journey is looking great. You've completed 92% of your goals for this cycle.
          </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => navigate('/hr/my-performance')}
             className="px-6 py-3 bg-blue-600 rounded-2xl text-sm font-black text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:shadow-blue-500/40 transition-all transform active:scale-95"
           >
              View My KPIs
           </button>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {myStats.map((stat) => (
          <div key={stat.label} className="group overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm border border-white hover:shadow-2xl hover:border-blue-50 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                <i className={`bi ${stat.icon}`} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.color} ${stat.bg} uppercase tracking-wider`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-4xl font-black text-slate-900 leading-none mb-3 tracking-tighter">{stat.value}</p>
            <p className="text-xs font-bold text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-white shadow-sm hover:shadow-xl transition-shadow">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Current Goals</h2>
              <button onClick={() => navigate('/hr/goals')} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
           </div>
           <div className="space-y-8">
              {[
                { name: 'Quality of Work', progress: 95, color: 'bg-emerald-500' },
                { name: 'On-time Delivery', progress: 85, color: 'bg-blue-500' },
                { name: 'Communication', progress: 70, color: 'bg-amber-500' },
              ].map(goal => (
                <div key={goal.name}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="font-black text-slate-700 text-sm">{goal.name}</span>
                    <span className="font-black text-slate-400 text-xs">{goal.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${goal.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${goal.progress}%` }}></div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 text-white flex flex-col h-full">
              <h2 className="text-2xl font-black tracking-tight mb-4">Need 360 Feedback?</h2>
              <p className="text-slate-400 font-bold mb-8 flex-1">
                Request feedback from your colleagues to maintain a balanced perspective on your professional growth.
              </p>
              <button 
                onClick={() => navigate('/employee/360-feedback/give')}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-xl hover:bg-blue-50 transition-colors"
              >
                Send Feedback Request
              </button>
           </div>
           {/* Decorative background element */}
           <div className="absolute top-0 right-0 h-64 w-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/30 transition-colors"></div>
           <div className="absolute bottom-0 left-0 h-32 w-32 bg-purple-600/20 rounded-full blur-[60px] -ml-16 -mb-16 group-hover:bg-purple-600/30 transition-colors"></div>
        </div>
      </div>
    </div>
  )
}
