import React, { useEffect, useState } from 'react';
import { COLLECTIONS, Post, Account, Product, Talent } from '../types';
import { getData, addData, updateData, deleteData } from '../services/firestoreService';
import Modal from '../components/Modal';
import { Plus, Trash2, Filter, Edit2, Search, Check, X, Calendar, Calculator, ShoppingBag } from 'lucide-react';

// Interface untuk item di keranjang saat input baru
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

  // State untuk mode edit
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states for the list view
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
  const [filterTalent, setFilterTalent] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  // State untuk pencarian produk di dalam Modal
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Cart State untuk Mode Create (Multiple Products with Quantity)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [formData, setFormData] = useState({
    talentId: '',
    accountId: '',
    productId: '', // Hanya dipakai saat Edit Mode
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
      // Sort posts by date descending
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
        // Mode Update (Single Row Update)
        const selectedProduct = products.find(p => p.id === formData.productId);
        const payload = {
            ...basePayload,
            productId: formData.productId,
            productName: selectedProduct?.name || 'Unknown'
        };
        await updateData(COLLECTIONS.POSTS, editingId, payload);
      } else {
        // Mode Create (Bulk Insert from Cart)
        const promises: Promise<any>[] = [];
        
        cartItems.forEach(item => {
           // Create N entries based on quantity
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
    setCartItems([]); // Clear cart in edit mode
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

  // --- Cart Logic (Create Mode) ---

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        // Increment Quantity
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
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

  // --- Filtering Logic ---

  // Filter accounts based on selected talent in modal
  const filteredAccounts = accounts.filter(a => a.talentId === formData.talentId);
  
  // Filter products based on selected ACCOUNT in modal AND search term
  const availableProducts = products.filter(p => p.accountId === formData.accountId);
  const displayedProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Filter posts for the table view (Month/Year + Search)
  const filteredPosts = posts.filter(p => {
    const postDate = new Date(p.date);
    const isMonthMatch = postDate.getMonth() === filterMonth;
    const isYearMatch = postDate.getFullYear() === filterYear;
    
    const matchTalent = filterTalent ? (p.talentName || '').toLowerCase().includes(filterTalent.toLowerCase()) : true;
    const matchProduct = filterProduct ? (p.productName || '').toLowerCase().includes(filterProduct.toLowerCase()) : true;
    
    return isMonthMatch && isYearMatch && matchTalent && matchProduct;
  });

  // --- Real-time Stats Logic ---
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
          <h2 className="text-2xl font-bold text-gray-800">Data Postingan</h2>
          <p className="text-sm text-gray-500">Monitor konten per Talent (Bulanan)</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={20} />
          <span>Catat Konten</span>
        </button>
      </div>

      {/* Main Filters (List View) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium whitespace-nowrap">
            <Filter size={18} />
            <span>Filter:</span>
        </div>
        
        {/* Month & Year Filter */}
        <div className="flex gap-2">
            <div className="relative">
                <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    {months.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                    ))}
                </select>
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
            <div className="relative">
                <select 
                    value={filterYear} 
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Text Search Filters */}
        <div className="flex-1 flex gap-2 w-full">
            <input 
            type="text" 
            placeholder="Cari Nama Talent..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterTalent}
            onChange={(e) => setFilterTalent(e.target.value)}
            />
            <input 
            type="text" 
            placeholder="Cari Produk..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Nama Talent</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Akun Media</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Produk</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> : 
              filteredPosts.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada data postingan pada periode ini.</td></tr> :
              filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{post.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{post.talentName || '-'}</td>
                  <td className="px-6 py-4 text-blue-600">{post.accountName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      {post.productName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(post)} 
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                        title="Edit Postingan"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
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

      {/* Modal Input/Edit */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingId ? "Edit Data Postingan" : "Catat Konten Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Input: Date & Talent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Tanggal Posting</label>
                <input type="date" required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" 
                value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Nama Talent</label>
                <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm" 
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

          {/* Real-time Status Card */}
          {formData.talentId && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800">
                    <Calculator size={18} />
                    <span className="text-sm font-medium">Total Postingan Hari Ini:</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{getDailyPostCount()}</span>
            </div>
          )}

          {/* Account Selection */}
          <div>
             <label className="block text-sm font-medium mb-1">Akun Media</label>
             <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400" 
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

          {/* Product Selection Area */}
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Produk & Jumlah Konten</label>
            
            {/* Case 1: Edit Mode (Single Product) */}
            {editingId ? (
                <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                >
                    <option value="">-- Pilih Produk --</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            ) : (
                /* Case 2: Create Mode (Multi Product with Cart) */
                <div className={`border rounded-lg overflow-hidden ${!formData.accountId ? 'bg-gray-100 opacity-70 pointer-events-none' : 'bg-white'}`}>
                    {/* Search Bar */}
                    <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={!formData.accountId ? "Pilih akun dulu..." : "Cari produk untuk ditambahkan..."}
                            className="bg-transparent w-full text-sm focus:outline-none"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            disabled={!formData.accountId}
                        />
                        {productSearchTerm && (
                            <button type="button" onClick={() => setProductSearchTerm('')}>
                                <X size={14} className="text-gray-400 hover:text-gray-600"/>
                            </button>
                        )}
                    </div>

                    {/* Product List */}
                    <div className="max-h-40 overflow-y-auto p-1 border-b">
                         {displayedProducts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">
                                 {productSearchTerm ? "Tidak ada produk yang cocok." : "Belum ada produk untuk akun ini."}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {displayedProducts.map(p => {
                                    // Check if already in cart
                                    const inCart = cartItems.find(item => item.product.id === p.id);
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => addToCart(p)}
                                            className="flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-50 group"
                                        >
                                            <span className="truncate flex-1">{p.name}</span>
                                            {inCart ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Ditambahkan ({inCart.quantity})</span>
                                            ) : (
                                                <Plus size={16} className="text-gray-400 group-hover:text-blue-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Cart Items */}
                    <div className="p-3 bg-gray-50 min-h-[100px]">
                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase flex items-center gap-1">
                            <ShoppingBag size={12}/> Produk Terpilih ({cartItems.length})
                        </h5>
                        {cartItems.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Klik produk di atas untuk menambahkan.</p>
                        ) : (
                            <div className="space-y-2">
                                {cartItems.map(item => (
                                    <div key={item.product.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-gray-100">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="text-sm font-medium text-gray-800 truncate" title={item.product.name}>
                                                {item.product.name}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-gray-200 rounded-md">
                                                <button type="button" onClick={() => updateQuantity(item.product.id, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 border-r">-</button>
                                                <span className="px-2 text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.product.id, 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 border-l">+</button>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={!editingId && cartItems.length === 0}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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