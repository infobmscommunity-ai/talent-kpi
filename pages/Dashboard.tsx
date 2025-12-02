
import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Sale, Talent, Post, Account, Product } from '../types';
import { getData } from '../services/firestoreService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { DollarSign, TrendingUp, Users, FileText, Filter, Calendar, ShoppingBag, Package, Zap } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }: { title: string, value: string, subtext?: string, icon: any, color: string }) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between hover:border-amber-500/30 transition-all group">
    <div>
      <p className="text-sm font-medium text-slate-400 mb-1 group-hover:text-amber-500 transition-colors">{title}</p>
      <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('500', '500/10')} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // New Filters
  const [selectedTalentId, setSelectedTalentId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, talentsData, postsData, accountsData, productsData] = await Promise.all([
          getData<Sale>(COLLECTIONS.SALES),
          getData<Talent>(COLLECTIONS.TALENTS),
          getData<Post>(COLLECTIONS.POSTS),
          getData<Account>(COLLECTIONS.ACCOUNTS),
          getData<Product>(COLLECTIONS.PRODUCTS)
        ]);
        setSales(salesData);
        setTalents(talentsData);
        setPosts(postsData);
        setAccounts(accountsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Filtering Logic ---
  
  const isInSelectedPeriod = (dateString: string) => {
    const d = new Date(dateString);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  };

  const availableAccounts = selectedTalentId 
    ? accounts.filter(a => a.talentId === selectedTalentId)
    : accounts;

  const matchesContext = (itemTalentId: string, itemAccountId: string) => {
    const talentMatch = selectedTalentId ? itemTalentId === selectedTalentId : true;
    const accountMatch = selectedAccountId ? itemAccountId === selectedAccountId : true;
    return talentMatch && accountMatch;
  };

  const filteredSalesOverall = sales.filter(s => 
    isInSelectedPeriod(s.date) && 
    s.type === 'Overall' &&
    matchesContext(s.talentId, s.accountId)
  );
  
  const filteredSalesProduct = sales.filter(s => 
    isInSelectedPeriod(s.date) && 
    s.type === 'Product' &&
    matchesContext(s.talentId, s.accountId)
  );

  const filteredPosts = posts.filter(p => 
    isInSelectedPeriod(p.date) &&
    matchesContext(p.talentId, p.accountId)
  );

  const filteredProducts = products.filter(p => {
    const acc = accounts.find(a => a.id === p.accountId);
    if (!acc) return false;
    return matchesContext(acc.talentId, p.accountId);
  });
  
  const filteredAccountsForTable = accounts.filter(a => matchesContext(a.talentId, a.id));

  const talentPostSummary = talents.map(t => {
      const count = filteredPosts.filter(p => p.talentId === t.id).length;
      return { id: t.id, name: t.name, count };
  }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  const totalRevenue = filteredSalesOverall.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  const totalViews = filteredSalesOverall.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
  const totalPosts = filteredPosts.length;
  const totalProductsCount = filteredProducts.length;

  const accountStats = filteredAccountsForTable.map(acc => {
    const accRevenue = sales
        .filter(s => s.accountId === acc.id && s.type === 'Overall' && isInSelectedPeriod(s.date))
        .reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);

    const accPostCount = posts
        .filter(p => p.accountId === acc.id && isInSelectedPeriod(p.date))
        .length;

    const accProductCount = products.filter(p => p.accountId === acc.id).length;

    return {
      ...acc,
      revenue: accRevenue,
      postCount: accPostCount,
      productCount: accProductCount
    };
  });

  const topAccountsByRevenue = [...accountStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const productStats = filteredProducts.map(prod => {
      const prodPosts = filteredPosts.filter(p => p.productId === prod.id).length;
      const prodSales = filteredSalesProduct.filter(s => s.productId === prod.id);
      const prodQty = prodSales.reduce((sum, s) => sum + Number(s.quantity), 0);
      const prodRevenue = prodSales.reduce((sum, s) => sum + Number(s.revenue), 0);

      return {
          ...prod,
          periodPosts: prodPosts,
          periodQty: prodQty,
          periodRevenue: prodRevenue
      };
  });

  const sortedProductStats = productStats.sort((a, b) => b.periodRevenue - a.periodRevenue);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRevenue = filteredSalesOverall
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
    return { day, revenue: dayRevenue };
  });

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  if (loading) return <div className="flex h-full items-center justify-center text-amber-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Main Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Dashboard Performa</h2>
          <p className="text-sm text-slate-500">
            Periode: <span className="text-amber-500 font-medium">{months[selectedMonth]} {selectedYear}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Filter Talent */}
          <div className="relative min-w-[150px] flex-1">
             <select 
               className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500 appearance-none"
               value={selectedTalentId}
               onChange={(e) => { setSelectedTalentId(e.target.value); setSelectedAccountId(''); }}
             >
               <option value="">Semua Talent</option>
               {talents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>

          {/* Filter Account */}
          <div className="relative min-w-[150px] flex-1">
             <select 
               className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500 appearance-none disabled:opacity-50"
               value={selectedAccountId}
               onChange={(e) => setSelectedAccountId(e.target.value)}
               disabled={!selectedTalentId}
             >
               <option value="">Semua Akun</option>
               {availableAccounts.map(a => <option key={a.id} value={a.id}>{a.username} ({a.platform})</option>)}
             </select>
             <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>

          {/* Filter Month/Year */}
          <div className="flex gap-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <div className="relative border-r border-slate-800">
                <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="pl-3 pr-6 py-2 bg-transparent text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer hover:text-amber-500 transition-colors"
                >
                {months.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                ))}
                </select>
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
            </div>
            <div className="relative">
                <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="pl-3 pr-6 py-2 bg-transparent text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer hover:text-amber-500 transition-colors"
                >
                {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                ))}
                </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Omset (GMV)" 
          value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} 
          subtext="Berdasarkan filter terpilih"
          icon={DollarSign} 
          color="text-emerald-500" 
        />
        <StatCard 
          title="Total Postingan" 
          value={totalPosts.toLocaleString()} 
          subtext={`Konten dibuat pada ${months[selectedMonth]}`}
          icon={FileText} 
          color="text-purple-500" 
        />
        <StatCard 
          title="Total Views" 
          value={totalViews.toLocaleString()} 
          subtext="Akumulasi views (Overall)"
          icon={TrendingUp} 
          color="text-amber-500" 
        />
        <StatCard 
          title="Produk Terdaftar" 
          value={totalProductsCount.toLocaleString()} 
          subtext="Jumlah produk sesuai filter"
          icon={ShoppingBag} 
          color="text-blue-500" 
        />
      </div>

      {/* Talent Activity Summary (Rangkuman) */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
            <Zap className="text-amber-500" size={18} />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                Rangkuman Aktivitas Talent ({months[selectedMonth]})
            </h3>
        </div>
        <div className="flex flex-wrap gap-3">
            {talentPostSummary.length === 0 ? (
                <p className="text-sm text-slate-500 italic px-1">Belum ada aktivitas postingan pada periode ini.</p>
            ) : (
                talentPostSummary.map(t => (
                    <div key={t.id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg hover:border-amber-500/30 transition-all">
                        <span className="text-sm font-bold text-slate-200">{t.name}</span>
                        <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md border border-amber-500/20">
                            {t.count} Postingan
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Accounts Revenue */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Top Akun (Omset Tertinggi)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAccountsByRevenue} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="username" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Revenue Trend */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Tren Omset Harian ({months[selectedMonth]})</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="day" tick={{fontSize: 12, fill: '#94a3b8'}} interval={2} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                  labelFormatter={(label) => `Tanggal ${label} ${months[selectedMonth]}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Account Performance Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
                <Users className="text-amber-500" size={20} />
                <h3 className="text-lg font-bold text-slate-100">Detail Performa Akun</h3>
            </div>
            <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                Periode: {months[selectedMonth]} {selectedYear}
            </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-200">Nama Akun</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Talent</th>
                <th className="px-6 py-4 font-semibold text-center text-slate-200">Total Produk</th>
                <th className="px-6 py-4 font-semibold text-center text-slate-200">Jml Konten (Bln Ini)</th>
                <th className="px-6 py-4 font-semibold text-slate-200 text-right">Omset (Bln Ini)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accountStats.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data akun sesuai filter.</td></tr>
              ) : (
                accountStats.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{acc.username}</div>
                        <div className="text-xs text-amber-600/80">{acc.platform}</div>
                    </td>
                    <td className="px-6 py-4">{acc.talentName}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
                            {acc.productCount}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${acc.postCount > 0 ? 'bg-purple-900/20 text-purple-400 border border-purple-500/20' : 'text-slate-600'}`}>
                            {acc.postCount}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">
                        Rp {acc.revenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Performance Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
                <Package className="text-purple-500" size={20} />
                <h3 className="text-lg font-bold text-slate-100">Detail Performa Produk</h3>
            </div>
            <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                Periode: {months[selectedMonth]} {selectedYear}
            </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-200">Nama Produk</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Akun Pemilik</th>
                <th className="px-6 py-4 font-semibold text-center text-slate-200">Postingan (Bln Ini)</th>
                <th className="px-6 py-4 font-semibold text-center text-slate-200">Terjual / Qty</th>
                <th className="px-6 py-4 font-semibold text-slate-200 text-right">Omset Produk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedProductStats.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data produk sesuai filter.</td></tr>
              ) : (
                sortedProductStats.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{prod.name}</td>
                    <td className="px-6 py-4">
                        <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                            {prod.accountName}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${prod.periodPosts > 0 ? 'bg-green-900/20 text-green-400 border border-green-500/20' : 'text-slate-600'}`}>
                            {prod.periodPosts}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-300">
                            {prod.periodQty.toLocaleString()}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">
                        Rp {prod.periodRevenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
