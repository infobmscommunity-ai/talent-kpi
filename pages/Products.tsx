import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Product, Account } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Edit2, Search } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk mode edit
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
        // Mode Update
        await updateData(COLLECTIONS.PRODUCTS, editingId, payload);
      } else {
        // Mode Create
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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-sm text-gray-500">Kelola link produk affiliasi per akun media sosial</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="Cari produk..." 
               className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Nama Produk</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Akun Media</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Link Produk</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : 
               filteredProducts.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada data produk.</td></tr> :
               filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                      {product.accountName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.link ? (
                      <a href={product.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <LinkIcon size={14} />
                        <span className="truncate max-w-[200px]">{product.link}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Tidak ada link</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                        title="Edit Produk"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Akun Media</label>
            <select 
              required 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
            <input 
              type="text" 
              required 
              placeholder="Contoh: Kemeja Flannel Merah"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Produk</label>
            <input 
              type="url" 
              required 
              placeholder="https://shopee.co.id/..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.link} 
              onChange={(e) => setFormData({...formData, link: e.target.value})} 
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
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