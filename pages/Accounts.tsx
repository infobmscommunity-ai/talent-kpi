
import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Account, Talent } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import ExportMenu from '../components/ExportMenu';
import { Plus, Trash2, Smartphone, AtSign, Edit2 } from 'lucide-react';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    talentId: '',
    platform: 'Instagram' as 'Instagram' | 'TikTok' | 'YouTube' | 'Shopee Video',
    username: '',
    followers: 0
  });

  const fetchData = async () => {
    try {
      const [accData, talData] = await Promise.all([
        getData<Account>(COLLECTIONS.ACCOUNTS),
        getData<Talent>(COLLECTIONS.TALENTS)
      ]);
      setAccounts(accData);
      setTalents(talData);
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
    
    const dataPayload = {
      ...formData,
      talentName: selectedTalent?.name || 'Unknown'
    };

    try {
      if (editingId) {
        await updateData(COLLECTIONS.ACCOUNTS, editingId, dataPayload);
      } else {
        await addData(COLLECTIONS.ACCOUNTS, dataPayload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      await deleteData(COLLECTIONS.ACCOUNTS, id);
      fetchData();
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setFormData({
      talentId: account.talentId,
      platform: account.platform,
      username: account.username,
      followers: account.followers
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ talentId: '', platform: 'Instagram', username: '', followers: 0 });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Akun Media</h2>
          <p className="text-sm text-slate-500">Kelola akun sosial media milik talent</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu data={accounts} filename="data-akun" />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
          >
            <Plus size={20} />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p className="col-span-3 text-center py-8 text-amber-500">Loading data...</p> : 
         accounts.length === 0 ? <p className="col-span-3 text-center py-8 text-slate-600">Belum ada data akun.</p> :
         accounts.map((account) => (
          <div key={account.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg hover:border-amber-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-800 text-amber-500 rounded-lg border border-slate-700">
                <Smartphone size={24} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(account)} 
                  className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-full transition-colors"
                  title="Edit Akun"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(account.id)} 
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                  title="Hapus Akun"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1 overflow-hidden text-ellipsis group-hover:text-amber-500 transition-colors">
              <AtSign size={16} className="text-slate-500 shrink-0"/>
              <span className="truncate">{account.username}</span>
            </h3>
            <p className="text-sm text-slate-500 mb-4">{account.platform}</p>
            
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">Milik Talent</span>
              <span className="text-sm font-semibold text-slate-300 truncate max-w-[120px]" title={account.talentName}>
                {account.talentName}
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
               <span className="text-xs font-medium text-slate-500">Followers</span>
               <span className="text-sm font-semibold text-slate-300">{Number(account.followers).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingId ? "Edit Akun Media" : "Tambah Akun Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Talent</label>
            <select 
              required
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.talentId}
              onChange={(e) => setFormData({...formData, talentId: e.target.value})}
            >
              <option value="">-- Pilih Talent --</option>
              {talents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
            <select 
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.platform}
              onChange={(e) => setFormData({...formData, platform: e.target.value as any})}
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Shopee Video">Shopee Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username (tanpa @)</label>
            <input 
              required
              type="text" 
              placeholder="username_akun"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah Followers</label>
            <input 
              required
              type="number" 
              min="0"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.followers}
              onChange={(e) => setFormData({...formData, followers: Number(e.target.value)})}
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
              {editingId ? 'Update Akun' : 'Simpan Akun'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Accounts;
