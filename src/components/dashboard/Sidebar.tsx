
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  List, 
  FileText, 
  Settings, 
  Clock, 
  BarChart3,
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userEmail, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'watchlist', label: 'Watchlist', icon: List },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-8 w-8 text-green-400 mr-2" />
          <span className="text-xl font-bold text-white">WheelTrader</span>
        </div>
        <p className="text-sm text-slate-400">Pro Analytics</p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    activeTab === item.id 
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-3 p-2 bg-slate-800 rounded-lg">
          <User className="h-5 w-5 text-slate-400 mr-2" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{userEmail}</p>
            <p className="text-xs text-slate-400">Pro Member</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
