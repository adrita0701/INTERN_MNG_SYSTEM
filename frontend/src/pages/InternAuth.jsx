import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, Mail, Lock, User, Phone, BookOpen, GraduationCap, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../config';

const InternAuth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError('');
    setSuccess('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      college: '',
      department: '',
      password: '',
      confirmPassword: ''
    });
  }, [initialMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const url = isLogin ? `${API_BASE}/api/intern/login` : `${API_BASE}/api/intern/signup`;
    const bodyData = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        login(data.token, { ...data.intern, role: 'intern' });
        navigate('/intern/dashboard');
      } else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            college: '',
            department: '',
            password: '',
            confirmPassword: ''
          });
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
    <div className="min-h-screen bg-mesh-gradient flex items-center justify-center px-6 py-12 relative font-sans">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-all glass px-4 py-2 rounded-xl"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-semibold">Back to Home</span>
      </button>

      <div className="w-full max-w-lg glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex flex-col items-center space-y-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? 'Intern Login' : 'Intern Registration'}
          </h2>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            {isLogin 
              ? 'Log in to update your task progress and upload deliverables' 
              : 'Create your account to start tracking tasks and deliverables'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SIGNUP SPECIFIC FIELDS */}
          {!isLogin && (
            <>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                  <User className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                  <input 
                    type="text" 
                    id="fullName"
                    name="fullName"
                    required 
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* College */}
              <div>
                <label htmlFor="college" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  College / University
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                  <GraduationCap className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                  <input 
                    type="text" 
                    id="college"
                    name="college"
                    required 
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                    placeholder="e.g. NIT Meghalaya"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Department
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                  <BookOpen className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                  <input 
                    type="text" 
                    id="department"
                    name="department"
                    required 
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                  <Phone className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                  <input 
                    type="text" 
                    id="phone"
                    name="phone"
                    required 
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
              <Mail className="text-slate-400 mr-3 flex-shrink-0" size={18} />
              <input 
                type="email" 
                id="email"
                name="email"
                required 
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
              <Lock className="text-slate-400 mr-3 flex-shrink-0" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                name="password"
                required 
                value={formData.password}
                onChange={handleChange}
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

          {/* Confirm Password (Signup Only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="flex items-center rounded-xl bg-slate-900/70 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 px-3.5 transition-all">
                <Lock className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword"
                  name="confirmPassword"
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-transparent border-0 focus:outline-none text-slate-100 placeholder-slate-500 py-3 text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle link */}
        <div className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? (
            <p>
              New intern?{' '}
              <button 
                onClick={() => setIsLogin(false)}
                className="text-blue-400 hover:underline font-semibold"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button 
                onClick={() => setIsLogin(true)}
                className="text-blue-400 hover:underline font-semibold"
              >
                Log In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default InternAuth;
