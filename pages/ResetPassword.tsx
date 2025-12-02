import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Extract oobCode from query parameters
  const queryParams = new URLSearchParams(location.search);
  const oobCode = queryParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setError('Kode reset password tidak valid atau tidak ditemukan.');
      return;
    }

    // Verify the code
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setVerifying(false);
      })
      .catch((error) => {
        setVerifying(false);
        setError('Link reset password sudah kadaluarsa atau sudah digunakan.');
        console.error(error);
      });
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mereset password.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div className="min-h-screen flex items-center justify-center">Memverifikasi link...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Password Baru</h1>
          <p className="text-gray-500 text-sm">Silakan masukkan password baru untuk akun Anda.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-start gap-3 border border-red-100">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold">Terjadi Kesalahan</p>
              <p>{error}</p>
              <div className="mt-3">
                <Link to="/forgot-password" className="text-blue-600 underline">Kirim ulang link reset</Link>
              </div>
            </div>
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-lg text-center border border-green-100">
            <CheckCircle className="mx-auto mb-3 text-green-600" size={48} />
            <h3 className="text-lg font-bold mb-2">Password Berhasil Diubah!</h3>
            <p className="text-sm mb-4">Anda akan diarahkan ke halaman login dalam 3 detik...</p>
            <Link to="/login" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">
              Login Sekarang
            </Link>
          </div>
        ) : (
          !error && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="Password Baru"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="Konfirmasi Password Baru"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
};

export default ResetPassword;