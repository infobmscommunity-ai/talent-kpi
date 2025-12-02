
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Package, 
  FileText, 
  DollarSign, 
  LogOut,
  Crown
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg mb-1
      ${isActive 
        ? 'bg-amber-600/10 text-amber-500 border border-amber-600/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2 tracking-wide">
            <Crown className="text-amber-500 fill-amber-500/20" size={24} />
            PT BMS
          </h1>
          <p className="text-xs text-slate-500 mt-1 ml-8 tracking-wider">TALENT MANAGEMENT</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="my-4 border-t border-slate-800/50 mx-2"></div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Master Data</p>
          <SidebarItem to="/talents" icon={Users} label="Talents" />
          <SidebarItem to="/accounts" icon={Smartphone} label="Akun Media" />
          <SidebarItem to="/products" icon={Package} label="Produk" />
          
          <div className="my-4 border-t border-slate-800/50 mx-2"></div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tracking</p>
          <SidebarItem to="/posts" icon={FileText} label="Postingan" />
          <SidebarItem to="/sales" icon={DollarSign} label="Penjualan" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        {/* Background Gradient Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-slate-950 pointer-events-none z-0"></div>
        
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-6 md:hidden z-10 sticky top-0">
           <h1 className="text-lg font-bold text-amber-500">Talent PT BMS</h1>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8 z-10 relative custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
