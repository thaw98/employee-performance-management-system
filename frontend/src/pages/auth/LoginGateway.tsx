import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Briefcase, User, ArrowRight } from 'lucide-react';

const LoginGateway: React.FC = () => {
  const navigate = useNavigate();

  const portals = [
    {
      id: 'hr',
      title: 'HR & Executive',
      desc: 'Centralized tools for HR compliance, and performance oversight.',
      icon: <ShieldCheck className="w-8 h-8" />,
      color: 'from-blue-600 to-indigo-700',
      shadow: 'shadow-blue-200',
    },
    {
      id: 'manager',
      title: 'Management Hub',
      desc: 'Lead your team, review appraisals, and track direct reports.',
      icon: <Briefcase className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-700',
      shadow: 'shadow-emerald-200',
    },
    {
      id: 'employee',
      title: 'Employee Portal',
      desc: 'Track your personal goals, feedback, and career growth.',
      icon: <User className="w-8 h-8" />,
      color: 'from-violet-600 to-purple-800',
      shadow: 'shadow-purple-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-100/50 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/4"></div>

      <div className="max-w-6xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-slate-600 tracking-wide uppercase">Performance Management System</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-6xl">
            Unified Login <span className="text-blue-600 font-medium font-serif italic">Gateway</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium">
             Select your role category to access specialized tools and performance dashboards tailored to your position.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {portals.map((portal, idx) => (
            <div
              key={portal.id}
              onClick={() => navigate(`/login/${portal.id}`)}
              className={`group relative bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl ${portal.shadow} hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[${idx * 100}ms]`}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${portal.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                {portal.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{portal.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-8 font-medium">
                {portal.desc}
              </p>
              <div className="flex items-center text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                Enter Portal <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
              
              <div className={`absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity`}>
                   <div className={`text-8xl font-black uppercase text-slate-900`}>{portal.id}</div>
              </div>
            </div>
          ))}
        </div>

        <footer className="text-center text-slate-400 text-sm font-medium pt-8">
           &copy; 2026 EPMS Corporate Solutions. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LoginGateway;
