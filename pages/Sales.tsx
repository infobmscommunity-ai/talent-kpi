import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Sale, Product, Talent, Account } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import { Plus, Trash2, TrendingUp, ShoppingBag, Eye, MousePointer, Edit2, Filter, Calendar, X } from 'lucide-react';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk mode edit
  const [editingId, setEditingId] = useState<string | null>(null);

  // Tab State untuk Input: 'Overall' or 'Product'
  const [entryType, setEntryType] = useState<'Overall' | 'Product'>('Overall');

  // Tab State untuk Tampilan Tabel: 'Overall' | 'Product'
  const [viewTab, setViewTab] = useState<'Overall' | 'Product'>('Overall');

  // State Filter
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTalentId, setFilterTalentId] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    talentId: '',
    accountId: '',
    productId: '',
    
    // Metrics
    revenue: 0, // GMV/Omset
    commission: 0, // Estimasi Komisi
    quantity: 0, // Jumlah Terjual
    views: 0, // Produk Dilihat (Overall only)
    clicks: 0, // Produk Diklik (Overall only)
    
    status: 'Completed' as 'Pending' | 'Completed' | 'Cancelled'
  });

  const fetchData = async () => {
    try {
      const [salesData, productsData, talentsData, accountsData] = await Promise.all([
        getData<Sale>(COLLECTIONS.SALES),
        getData<Product>(COLLECTIONS.PRODUCTS),
        getData<Talent>(COLLECTIONS.TALENTS),
        getData<Account>(COLLECTIONS.ACCOUNTS)
      ]);
      // Sort sales by date descending
      const sortedSales = salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(sortedSales);
      setProducts(productsData);
      setTalents(talentsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedTalent = talents.find(t => t.id === formData.talentId);
    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    let selectedProduct = products.find(p => p.id === formData.productId);

    // Prepare data based on type
    const saleData: any = {
      type: entryType,
      date: formData.date,
      talentId: formData.talentId,
      talentName: selectedTalent?.name || 'Unknown',
      accountId: formData.accountId,
      accountName: selectedAccount?.username || 'Unknown',
      revenue: Number(formData.revenue),
      commission: Number(formData.commission),
      quantity: Number(formData.quantity),
      status: formData.status
    };

    if (entryType === 'Product') {
      saleData.productId = formData.productId;
      saleData.productName = selectedProduct?.name || 'Unknown';
    } else {
      // Overall
      saleData.productName = 'Performa Keseluruhan';
      saleData.views = Number(formData.views);
      saleData.clicks = Number(formData.clicks);
    }

    try {
      if (editingId) {
        // Mode Update
        await updateData(COLLECTIONS.SALES, editingId, saleData);
      } else {
        // Mode Create
        await addData(COLLECTIONS.SALES, saleData);
      }
      setIsModalOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      talentId: '',
      accountId: '',
      productId: '',
      revenue: 0,
      commission: 0,
      quantity: 0,
      views: 0,
      clicks: 0,
      status: 'Completed'
    });
    // Default entry type reset to match current view if possible, or default to Overall
    setEntryType('Overall');
  };

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setEntryType(sale.type);
    setFormData({
      date: sale.date,
      talentId: sale.talentId,
      accountId: sale.accountId,
      productId: sale.productId || '',
      revenue: sale.revenue,
      commission: sale.commission,
      quantity: sale.quantity,
      views: sale.views || 0,
      clicks: sale.clicks || 0,
      status: sale.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data penjualan ini?')) {
      await deleteData(COLLECTIONS.SALES, id);
      fetchData();
    }
  };

  // Helper untuk format angka input dengan titik
  const handleNumberChange = (field: keyof typeof formData, value: string) => {
    // Hapus karakter non-digit
    const cleanValue = value.replace(/\D/g, '');
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    setFormData({ ...formData, [field]: numValue });
  };

  // Helper display format rupiah/angka
  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID');
  };

  // --- Filtering Logic ---
  
  // Filter accounts based on selected talent (Form & Filter)
  const getFilteredAccounts = (selectedTalentId: string) => {
    return accounts.filter(a => a.talentId === selectedTalentId);
  };

  // Filter products based on selected ACCOUNT (Form)
  const filteredProductsForm = products.filter(p => p.accountId === formData.accountId);

  // Filter Sales Data for Table
  const filteredSales = sales.filter(sale => {
    // 1. Filter by View Tab (Keseluruhan vs Produk)
    if (sale.type !== viewTab) return false;

    // 2. Filter by Date Range
    if (filterStartDate && sale.date < filterStartDate) return false;
    if (filterEndDate && sale.date > filterEndDate) return false;

    // 3. Filter by Talent
    if (filterTalentId && sale.talentId !== filterTalentId) return false;

    // 4. Filter by Account
    if (filterAccountId && sale.accountId !== filterAccountId) return false;

    return true;
  });

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterTalentId('');
    setFilterAccountId('');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Penjualan & Performa</h2>
          <p className="text-sm text-gray-500">Rekap omset, komisi, dan performa talent</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={20} />
          <span>Input Data Baru</span>
        </button>
      </div>

      {/* --- Filter Section --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
          <Filter size={18} />
          <span>Filter Data</span>
          {(filterStartDate || filterEndDate || filterTalentId || filterAccountId) && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:underline ml-2 flex items-center gap-1">
              <X size={12} /> Reset Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            </div>
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Nama Talent</label>
             <select 
               className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={filterTalentId}
               onChange={(e) => { setFilterTalentId(e.target.value); setFilterAccountId(''); }}
             >
               <option value="">Semua Talent</option>
               {talents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Nama Akun</label>
             <select 
               className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
               value={filterAccountId}
               onChange={(e) => setFilterAccountId(e.target.value)}
               disabled={!filterTalentId}
             >
               <option value="">Semua Akun</option>
               {getFilteredAccounts(filterTalentId).map(a => (
                 <option key={a.id} value={a.id}>{a.username} ({a.platform})</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* --- View Tabs --- */}
      <div className="flex gap-1 mb-0 border-b border-gray-200">
        <button 
          onClick={() => setViewTab('Overall')}
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-t border-l border-r ${
            viewTab === 'Overall' 
            ? 'bg-white border-gray-200 border-b-white text-blue-600' 
            : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
          } relative -mb-px`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            Performa Keseluruhan
          </div>
        </button>
        <button 
          onClick={() => setViewTab('Product')}
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-t border-l border-r ${
            viewTab === 'Product' 
            ? 'bg-white border-gray-200 border-b-white text-purple-600' 
            : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
          } relative -mb-px`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} />
            Penjualan Produk
          </div>
        </button>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 shadow-sm overflow-hidden border-t-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Talent & Akun</th>
                {viewTab === 'Product' && <th className="px-6 py-4 font-semibold text-gray-900">Nama Produk</th>}
                <th className="px-6 py-4 font-semibold text-gray-900">Keuangan (GMV/Komisi)</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-center">Qty Terjual</th>
                {viewTab === 'Overall' && <th className="px-6 py-4 font-semibold text-gray-900">Trafik (View/Click)</th>}
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr> : 
               filteredSales.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-gray-400">Belum ada data untuk filter ini.</td></tr> :
               filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap align-top">{sale.date}</td>
                  <td className="px-6 py-4 align-top">
                    <div className="font-medium text-gray-900">{sale.talentName}</div>
                    <div className="text-xs text-blue-600">{sale.accountName}</div>
                  </td>
                  {viewTab === 'Product' && (
                     <td className="px-6 py-4 align-top font-medium text-gray-800">
                       {sale.productName}
                     </td>
                  )}
                  <td className="px-6 py-4 align-top">
                    <div className="text-gray-900 font-bold mb-1">Rp {formatNumber(sale.revenue)}</div>
                    <div className="text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-0.5 rounded">
                      Komisi: Rp {formatNumber(sale.commission)}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-center">
                    <span className="font-bold text-gray-800">{formatNumber(sale.quantity)}</span>
                  </td>
                  {viewTab === 'Overall' && (
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-1 text-xs mb-1">
                        <Eye size={14} className="text-gray-400"/> 
                        <span className="font-medium">{formatNumber(sale.views || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MousePointer size={14} className="text-gray-400"/> 
                        <span className="font-medium">{formatNumber(sale.clicks || 0)}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(sale)} 
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                        title="Edit Data"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Hapus Data"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Input --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { resetForm(); setIsModalOpen(false); }} 
        title={editingId ? "Edit Data Penjualan" : "Input Data Penjualan"}
      >
        {/* Tab Switcher inside Modal */}
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
          <button 
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${entryType === 'Overall' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setEntryType('Overall')}
          >
            Data Keseluruhan
          </button>
          <button 
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${entryType === 'Product' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setEntryType('Product')}
          >
            Data Produk
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identitas</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Data</label>
              <input type="date" required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                 value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Talent</label>
                <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                  value={formData.talentId} 
                  onChange={(e) => setFormData({...formData, talentId: e.target.value, accountId: '', productId: ''})}
                >
                    <option value="">-- Pilih Talent --</option>
                    {talents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Nama Akun</label>
                 <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100" 
                   value={formData.accountId} 
                   onChange={(e) => setFormData({...formData, accountId: e.target.value, productId: ''})}
                   disabled={!formData.talentId}
                 >
                     <option value="">-- Pilih Akun --</option>
                     {getFilteredAccounts(formData.talentId).map(a => <option key={a.id} value={a.id}>{a.username} ({a.platform})</option>)}
                 </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-lg space-y-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              {entryType === 'Overall' ? <TrendingUp size={16} className="text-blue-600" /> : <ShoppingBag size={16} className="text-purple-600" />}
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {entryType === 'Overall' ? 'Metrik Performa Harian' : 'Detail Produk Terjual'}
              </h4>
            </div>
            
            {entryType === 'Product' && (
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Produk</label>
                <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  value={formData.productId} 
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  disabled={!formData.accountId}
                >
                    <option value="">
                      {!formData.accountId ? '-- Pilih Akun Terlebih Dahulu --' : '-- Pilih Produk --'}
                    </option>
                    {filteredProductsForm.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Omset / GMV (Rp)</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                  placeholder="0"
                  value={formData.revenue === 0 && formData.revenue.toString() === '0' ? '' : formatNumber(formData.revenue)} 
                  onChange={(e) => handleNumberChange('revenue', e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Est. Komisi (Rp)</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" 
                  placeholder="0"
                  value={formData.commission === 0 && formData.commission.toString() === '0' ? '' : formatNumber(formData.commission)} 
                  onChange={(e) => handleNumberChange('commission', e.target.value)} 
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium mb-1">Jumlah Produk Terjual (Qty)</label>
               <input 
                 type="text" 
                 required 
                 className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" 
                 placeholder="0"
                 value={formData.quantity === 0 && formData.quantity.toString() === '0' ? '' : formatNumber(formData.quantity)} 
                 onChange={(e) => handleNumberChange('quantity', e.target.value)} 
                />
            </div>

            {/* Additional Metrics only for Overall */}
            {entryType === 'Overall' && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100">
                <div>
                   <label className="block text-sm font-medium mb-1 text-gray-600">Produk Dilihat (View)</label>
                   <input 
                     type="text" 
                     required 
                     className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" 
                     placeholder="0"
                     value={formData.views === 0 && formData.views.toString() === '0' ? '' : formatNumber(formData.views)} 
                     onChange={(e) => handleNumberChange('views', e.target.value)} 
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1 text-gray-600">Produk Diklik (Click)</label>
                   <input 
                     type="text" 
                     required 
                     className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" 
                     placeholder="0"
                     value={formData.clicks === 0 && formData.clicks.toString() === '0' ? '' : formatNumber(formData.clicks)} 
                     onChange={(e) => handleNumberChange('clicks', e.target.value)} 
                    />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
             <button 
              type="button"
              onClick={() => { resetForm(); setIsModalOpen(false); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button type="submit" className={`flex-1 text-white py-2.5 rounded-lg font-medium shadow-md transition-all ${entryType === 'Overall' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {editingId ? 'Update Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;