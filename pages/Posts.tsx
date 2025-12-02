
import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Post, Account, Product, Talent } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import ExportMenu from '../components/ExportMenu';
import { Plus, Trash2, Filter, Edit2, Search, Check, X, Calendar, Calculator, ShoppingBag } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterTalent, setFilterTalent] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [formData, setFormData] = useState({
    talentId: '',
    accountId: '',
    productId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [postsData, accData, prodData, talentData] = await Promise.all([
        getData<Post>(COLLECTIONS.POSTS),
        getData<Account>(COLLECTIONS.ACCOUNTS),
        getData<Product>(COLLECTIONS.PRODUCTS),
        getData<Talent>(COLLECTIONS.TALENTS)
      ]);
      const sortedPosts = postsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(sortedPosts);
      setAccounts(accData);
      setProducts(prodData);
      setTalents(talentData);
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

    if (!selectedTalent || !selectedAccount) return;

    const basePayload = {
      date: formData.date,
      talentId: formData.talentId,
      talentName: selectedTalent.name,
      accountId: formData.accountId,
      accountName: selectedAccount.username,
    };

    try {
      if (editingId) {
        const selectedProduct = products.find(p => p.id === formData.productId);
        const payload = {
            ...basePayload,
            productId: formData.productId,
            productName: selectedProduct?.name || 'Unknown'
        };
        await updateData(COLLECTIONS.POSTS, editingId, payload);
      } else {
        const promises: Promise<any>[] = [];
        
        cartItems.forEach(item => {
           for (let i = 0; i < item.quantity; i++) {
             promises.push(
               addData(COLLECTIONS.POSTS, {
                  ...basePayload,
                  productId: item.product.id,
                  productName: item.product.name,
                  views: 0,
                  likes: 0,
                  comments: 0
               })
             );
           }
        });

        await Promise.all(promises);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
      await deleteData(COLLECTIONS.POSTS, id);
      fetchData();
    }
  };

  const handleEdit = (post: Post) => {
    setEditingId(post.id);
    setFormData({
      date: post.date,
      talentId: post.talentId,
      accountId: post.accountId,
      productId: post.productId
    });
    setCartItems([]);
    setProductSearchTerm(''); 
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setProductSearchTerm('');
    setCartItems([]);
    setFormData({
      talentId: '',
      accountId: '',
      productId: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const filteredAccounts = accounts.filter(a => a.talentId === formData.talentId);
  const availableProducts = products.filter(p => p.accountId === formData.accountId);
  const displayedProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(p => {
    const postDate = new Date(p.date);
    const isMonthMatch = postDate.getMonth() === filterMonth;
    const isYearMatch = postDate.getFullYear() === filterYear;
    
    const matchTalent = filterTalent ? (p.talentName || '').toLowerCase().includes(filterTalent.toLowerCase()) : true;
    const matchProduct = filterProduct ? (p.productName || '').toLowerCase().includes(filterProduct.toLowerCase()) : true;
    
    return isMonthMatch && isYearMatch && matchTalent && matchProduct;
  });

  const getDailyPostCount = () => {
    if (!formData.talentId || !formData.date) return 0;
    return posts.filter(p => 
      p.talentId === formData.talentId && 
      p.date === formData.date
    ).length;
  };

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Data Postingan</h2>
          <p className="text-sm text-slate-500">Monitor konten per Talent (Bulanan)</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20">
          <Plus size={20} />
          <span>Catat Konten</span>
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="flex items-center gap-2 text-slate-400 font-medium whitespace-nowrap">
            <Filter size={18} />
            <span>Filter:</span>
        </div>
        
        <div className="flex gap-2">
            <div className="relative">
                <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className="pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                >
                    {months.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                    ))}
                </select>
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>
            <div className="relative">
                <select 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex-1 flex gap-2 w-full">
            <input 
            type="text" 
            placeholder="Cari Nama Talent..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            value={filterTalent}
            onChange={(e) => setFilterTalent(e.target.value)}
            />
            <input 
            type="text" 
            placeholder="Cari Produk..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            />
        </div>
        <ExportMenu data={filteredPosts} filename={`data-postingan-${months[filterMonth]}-${filterYear}`} />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-200">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Nama Talent</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Akun Media</th>
                <th className="px-6 py-4 font-semibold text-slate-200">Produk</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={5} className="p-4 text-center text-amber-500">Loading...</td></tr> : 
              filteredPosts.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-600">Belum ada data postingan pada periode ini.</td></tr> :
              filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{post.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{post.talentName || '-'}</td>
                  <td className="px-6 py-4 text-amber-500">{post.accountName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-medium border border-slate-700">
                      {post.productName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(post)} 
                        className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-900/20"
                        title="Edit Postingan"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-900/20"
                        title="Hapus Postingan"
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
        title={editingId ? "Edit Data Postingan" : "Catat Konten Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Posting</label>
                <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500" 
                value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Talent</label>
                <select required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500" 
                value={formData.talentId} 
                onChange={(e) => {
                    setFormData({...formData, talentId: e.target.value, accountId: '', productId: ''});
                    setCartItems([]);
                }} 
                >
                    <option value="">-- Pilih Talent --</option>
                    {talents.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
          </div>

          {formData.talentId && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500">
                    <Calculator size={18} />
                    <span className="text-sm font-medium">Total Postingan Hari Ini:</span>
                </div>
                <span className="text-lg font-bold text-amber-400">{getDailyPostCount()}</span>
            </div>
          )}

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Akun Media</label>
             <select required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50" 
               value={formData.accountId} 
               onChange={(e) => {
                   setFormData({...formData, accountId: e.target.value, productId: ''});
                   setCartItems([]);
               }}
               disabled={!formData.talentId}
             >
                 <option value="">
                   {!formData.talentId ? '-- Pilih Talent Terlebih Dahulu --' : '-- Pilih Akun --'}
                 </option>
                 {filteredAccounts.map(a => <option key={a.id} value={a.id}>{a.username} ({a.platform})</option>)}
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Produk & Jumlah Konten</label>
            
            {editingId ? (
                <select required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                >
                    <option value="">-- Pilih Produk --</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            ) : (
                <div className={`border border-slate-800 rounded-lg overflow-hidden ${!formData.accountId ? 'opacity-50 pointer-events-none' : 'bg-slate-900'}`}>
                    <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
                        <Search size={16} className="text-slate-500" />
                        <input 
                            type="text" 
                            placeholder={!formData.accountId ? "Pilih akun dulu..." : "Cari produk..."}
                            className="bg-transparent w-full text-sm text-slate-200 focus:outline-none placeholder-slate-600"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            disabled={!formData.accountId}
                        />
                        {productSearchTerm && (
                            <button type="button" onClick={() => setProductSearchTerm('')}>
                                <X size={14} className="text-slate-500 hover:text-slate-300"/>
                            </button>
                        )}
                    </div>

                    <div className="max-h-40 overflow-y-auto p-1 border-b border-slate-800 custom-scrollbar">
                         {displayedProducts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">
                                 {productSearchTerm ? "Tidak ada produk yang cocok." : "Belum ada produk untuk akun ini."}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {displayedProducts.map(p => {
                                    const inCart = cartItems.find(item => item.product.id === p.id);
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => addToCart(p)}
                                            className="flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm hover:bg-slate-800 group text-slate-300 hover:text-slate-100"
                                        >
                                            <span className="truncate flex-1">{p.name}</span>
                                            {inCart ? (
                                                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded font-medium border border-green-500/20">Added ({inCart.quantity})</span>
                                            ) : (
                                                <Plus size={16} className="text-slate-600 group-hover:text-amber-500" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-950 min-h-[100px]">
                        <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1">
                            <ShoppingBag size={12}/> Produk Terpilih ({cartItems.length})
                        </h5>
                        {cartItems.length === 0 ? (
                            <p className="text-xs text-slate-600 italic">Klik produk di atas untuk menambahkan.</p>
                        ) : (
                            <div className="space-y-2">
                                {cartItems.map(item => (
                                    <div key={item.product.id} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="text-sm font-medium text-slate-200 truncate" title={item.product.name}>
                                                {item.product.name}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-slate-700 rounded-md bg-slate-950">
                                                <button type="button" onClick={() => updateQuantity(item.product.id, -1)} className="px-2 py-1 text-slate-400 hover:bg-slate-800 border-r border-slate-700">-</button>
                                                <span className="px-2 text-sm font-semibold w-8 text-center text-slate-200">{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.product.id, 1)} className="px-2 py-1 text-slate-400 hover:bg-slate-800 border-l border-slate-700">+</button>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 p-1">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
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
              disabled={!editingId && cartItems.length === 0}
              className="flex-1 bg-amber-600 text-white font-medium py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Update Data' : `Simpan (${cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} Konten)`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Posts;
