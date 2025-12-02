
import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Email tidak ditemukan.');
      } else {
        setError('Gagal mengirim email reset. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="mb-6">
          <Link to="/login" className="flex items-center text-sm text-slate-500 hover:text-amber-500 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-1" /> Kembali ke Login
          </Link>
          <h1 className="text-2xl font-bold text-amber-500 mb-2">Lupa Password?</h1>
          <p className="text-slate-400 text-sm">Masukkan email Anda untuk menerima link pembuatan password baru.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/20">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 text-green-400 p-3 rounded-lg mb-4 text-sm border border-green-500/20">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
            <input 
              type="email" 
              required
              placeholder="Masukkan Email Terdaftar"
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-600 text-white font-bold py-3 rounded-lg hover:bg-amber-500 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
