import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Talent } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import { Plus, Trash2, Search, Edit2 } from 'lucide-react';

const Talents: React.FC = () => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk mode edit
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
        // Mode Update
        await updateData(COLLECTIONS.TALENTS, editingId, formData);
      } else {
        // Mode Create
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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Talent</h2>
          <p className="text-sm text-gray-500">Kelola data talent (CRUD) dalam satu tempat</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari talent..." 
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
                <th className="px-6 py-4 font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Niche</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Tanggal Gabung</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading data...</td></tr>
              ) : filteredTalents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Tidak ada data ditemukan</td></tr>
              ) : (
                filteredTalents.map((talent) => (
                  <tr key={talent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{talent.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {talent.niche}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        talent.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {talent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{talent.joinDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(talent)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(talent.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Talent</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niche/Kategori</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Beauty, Tech"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.niche}
              onChange={(e) => setFormData({...formData, niche: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bergabung</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                />
            </div>
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
              {editingId ? 'Update Data' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Talents;