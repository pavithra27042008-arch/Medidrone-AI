import React from 'react';
import { UserAccount, UserRole } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  ShieldCheck, 
  User, 
  ChevronDown 
} from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
}) => {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-teal-500/50 rounded-xl px-2.5 py-1.5 cursor-pointer transition-all shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs font-mono">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-slate-200 leading-tight">
            {currentUser.name}
          </div>
          <span className="text-[10px] font-mono text-teal-400">
            {currentUser.role.replace(/_/g, ' ')}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 transition-colors" />
      </div>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in">
        <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800 mb-1">
          Switch Operational Role (RBAC)
        </div>
        {allUsers.map(user => (
          <div
            key={user.id}
            onClick={() => {
              soundFx.playClick(950);
              onSelectUser(user);
            }}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              currentUser.id === user.id
                ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-semibold">
              <span>{user.name}</span>
              <span className="text-[9px] font-mono text-teal-400">{user.role}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">{user.title}</div>
            <div className="text-[9px] font-mono text-slate-500">{user.hospitalAffiliation}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
