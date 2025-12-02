
import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Product, Account } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import ExportMenu from '../components/ExportMenu';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Edit2, Search } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    link: ''
  });

  const fetchData = async () => {
    try {
      const [prodData, accData] = await Promise.all([
        getData<Product>(COLLECTIONS.PRODUCTS),
        getData<Account>(COLLECTIONS.ACCOUNTS)
      ]);
      setProducts(prodData);
      setAccounts(accData);
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
    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    
    const payload = {
      ...formData,
      accountName: selectedAccount?.username || 'Unknown'
    };

    try {
      if (editingId) {
        await updateData(COLLECTIONS.PRODUCTS, editingId, payload);
      } else {
        await addData(COLLECTIONS.PRODUCTS, payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteData(COLLECTIONS.PRODUCTS, id);
      fetchData();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      accountId: product.accountId,
      name: product.name,
      link: product.link
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ accountId: '', name: '', link: '' });
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.accountName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Produk</h2>
          <p className="text-sm text-slate-500">Kelola link produk affiliasi per akun media sosial</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
             <input 
               type="text" 
               placeholder="Cari produk..." 
               className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <ExportMenu data={filteredProducts} filename="data-produk" />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
          >
            <Plus size={20} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-200">Nama Produk</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Akun Media</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Link Produk</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={4} className="p-4 text-center text-amber-500">Loading...</td></tr> : 
               filteredProducts.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-600">Belum ada data produk.</td></tr> :
               filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-amber-500 px-2 py-1 rounded-md text-xs font-medium border border-slate-700">
                      {product.accountName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.link ? (
                      <a href={product.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline">
                        <LinkIcon size={14} />
                        <span className="truncate max-w-[200px]">{product.link}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-slate-600 italic">Tidak ada link</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-900/20"
                        title="Edit Produk"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-900/20"
                        title="Hapus Produk"
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingId ? "Edit Produk" : "Tambah Produk Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Akun Media</label>
            <select 
              required 
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.accountId} 
              onChange={(e) => setFormData({...formData, accountId: e.target.value})}
            >
              <option value="">-- Pilih Akun --</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.username} ({account.platform}) - {account.talentName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nama Produk</label>
            <input 
              type="text" 
              required 
              placeholder="Contoh: Kemeja Flannel Merah"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Link Produk</label>
            <input 
              type="url" 
              required 
              placeholder="https://shopee.co.id/..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.link} 
              onChange={(e) => setFormData({...formData, link: e.target.value})} 
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-amber-600 text-white font-medium py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
            >
              {editingId ? 'Update Produk' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
