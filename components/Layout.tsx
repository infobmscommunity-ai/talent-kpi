
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Package, 
  FileText, 
  DollarSign, 
  LogOut,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg mb-1
      ${isActive 
        ? 'bg-amber-600/10 text-amber-500 border border-amber-600/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
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
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Get current page title for the header
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/talents': return 'Data Talent';
      case '/accounts': return 'Akun Media';
      case '/products': return 'Data Produk';
      case '/posts': return 'Data Postingan';
      case '/sales': return 'Data Penjualan';
      default: return 'Talent PT BMS';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-40 flex items-center justify-between px-4 md:px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            aria-label="Toggle Menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700">
                <Crown className="text-amber-500" size={16} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-100 leading-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-[10px] text-amber-500 font-medium tracking-widest hidden md:block">PT BMS MANAGEMENT</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
             <p className="text-xs text-slate-400">Selamat Datang,</p>
             <p className="text-sm font-semibold text-slate-200">{auth.currentUser?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-slate-800 border border-slate-700"></div>
        </div>
      </header>

      {/* Sidebar Overlay (Backdrop) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sliding Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2 tracking-wide">
            <Crown className="text-amber-500 fill-amber-500/20" size={24} />
            PT BMS
          </h2>
          <button 
            onClick={closeSidebar}
            className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-2">Main Menu</p>
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={closeSidebar} />
          
          <div className="my-4 border-t border-slate-800/50 mx-2"></div>
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Master Data</p>
          <SidebarItem to="/talents" icon={Users} label="Data Talent" onClick={closeSidebar} />
          <SidebarItem to="/accounts" icon={Smartphone} label="Akun Media" onClick={closeSidebar} />
          <SidebarItem to="/products" icon={Package} label="Data Produk" onClick={closeSidebar} />
          
          <div className="my-4 border-t border-slate-800/50 mx-2"></div>
          <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Laporan & Tracking</p>
          <SidebarItem to="/posts" icon={FileText} label="Data Postingan" onClick={closeSidebar} />
          <SidebarItem to="/sales" icon={DollarSign} label="Data Penjualan" onClick={closeSidebar} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut size={20} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative pt-16">
        {/* Background Gradient Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-slate-950 pointer-events-none z-0"></div>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 z-10 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
