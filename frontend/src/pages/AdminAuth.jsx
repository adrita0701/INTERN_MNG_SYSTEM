import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Shield, Mail, Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../config';

const AdminAuth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [adminExists, setAdminExists] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if admin exists on mount and mode changes
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/check-exists`);
        const data = await res.json();
        setAdminExists(data.exists);
      } catch (err) {
        console.error('Error checking admin presence:', err);
      }
    };
    checkAdmin();
  }, [isLogin]);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError('');
    setSuccess('');
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const url = isLogin ? `${API_BASE}/api/admin/login` : `${API_BASE}/api/admin/signup`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        login(data.token, { ...data.admin, role: 'admin' });
        navigate('/admin/dashboard');
      } else {
        setSuccess('Admin account created successfully! Redirecting to login...');
        setAdminExists(true);
        setTimeout(() => {
          setIsLogin(true);
          setPassword('');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-gradient flex items-center justify-center px-6 py-12 relative">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-all glass px-4 py-2 rounded-xl"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-semibold">Back to Home</span>
      </button>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex flex-col items-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600/25 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? 'Admin Portal' : 'Admin Registration'}
          </h2>
          <p className="text-sm text-slate-500 text-center">
            {isLogin ? 'Enter your credentials to access the admin panel' : 'Set up the single administrative account'}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-2">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-start space-x-2">
            <CheckCircle className="flex-shrink-0 mt-0.5" size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Strict Single Admin Check UI */}
        {!isLogin && adminExists ? (
          <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-4">
            <AlertTriangle className="mx-auto text-amber-500" size={32} />
            <h3 className="text-lg font-bold text-white">Admin account already exists.</h3>
            <p className="text-sm text-slate-400">
              Only one admin account is allowed. Please use the login page to access your account.
            </p>
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all border border-slate-700"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin Email</label>
              <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                <Mail className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                <input 
                  type="email" 
                  id="admin-email"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                  placeholder="admin@datayugsociety.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                <Lock className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="admin-password"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register Admin'}
            </button>
          </form>
        )}

        {/* Toggle between login/signup */}
        {(isLogin || !adminExists) && (
          <div className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? (
              <p>
                First time?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Create Admin Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAuth;
