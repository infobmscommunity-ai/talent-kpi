
import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Talent } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import ExportMenu from '../components/ExportMenu';
import { Plus, Trash2, Search, Edit2 } from 'lucide-react';

const Talents: React.FC = () => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    status: 'Active' as 'Active' | 'Inactive',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const fetchTalents = async () => {
    try {
      const data = await getData<Talent>(COLLECTIONS.TALENTS);
      setTalents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateData(COLLECTIONS.TALENTS, editingId, formData);
      } else {
        await addData(COLLECTIONS.TALENTS, formData);
      }
      handleCloseModal();
      fetchTalents();
    } catch (error) {
      console.error("Error saving talent:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus talent ini? Data yang dihapus tidak dapat dikembalikan.')) {
      await deleteData(COLLECTIONS.TALENTS, id);
      fetchTalents();
    }
  };

  const handleEdit = (talent: Talent) => {
    setEditingId(talent.id);
    setFormData({
      name: talent.name,
      niche: talent.niche,
      status: talent.status,
      joinDate: talent.joinDate
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      niche: '', 
      status: 'Active', 
      joinDate: new Date().toISOString().split('T')[0] 
    });
  };

  const filteredTalents = talents.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.niche || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Talent</h2>
          <p className="text-sm text-slate-500">Kelola data talent (CRUD) dalam satu tempat</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Cari talent..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ExportMenu data={filteredTalents} filename="data-talent" />
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
                <th className="px-6 py-4 font-semibold text-slate-200">Nama</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Niche</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Tanggal Gabung</th>
                <th className="px-6 py-4 font-semibold text-slate-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-amber-500">Loading data...</td></tr>
              ) : filteredTalents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-600">Tidak ada data ditemukan</td></tr>
              ) : (
                filteredTalents.map((talent) => (
                  <tr key={talent.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{talent.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-slate-800 text-amber-500 text-xs font-medium border border-slate-700">
                        {talent.niche}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        talent.status === 'Active' ? 'bg-green-900/20 text-green-400 border border-green-500/20' : 'bg-red-900/20 text-red-400 border border-red-500/20'
                      }`}>
                        {talent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{talent.joinDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(talent)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(talent.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-900/20"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingId ? "Edit Data Talent" : "Tambah Talent Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nama Talent</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Niche/Kategori</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Beauty, Tech"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={formData.niche}
              onChange={(e) => setFormData({...formData, niche: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select 
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Bergabung</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                />
            </div>
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
              {editingId ? 'Update Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Talents;
