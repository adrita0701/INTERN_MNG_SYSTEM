import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  X, 
  AlertCircle, 
  FileText, 
  Download, 
  Paperclip, 
  FileArchive, 
  FileSpreadsheet, 
  FileCheck,
  Phone,
  Mail,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { API_BASE, getFileUrl } from '../config';

const InternDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'tasks'
  const fileInputRef = useRef(null);

  // Intern profile state initialized from localStorage/AuthContext
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return user || null;
  });

  // Intern stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  // Task list
  const [tasks, setTasks] = useState([]);
  
  const [uploadTaskId, setUploadTaskId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [markCompletedOnSubmit, setMarkCompletedOnSubmit] = useState(true);
  
  // UI feedback & preview modals
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImagesModal, setPreviewImagesModal] = useState(null); // array of images to display
  const [fullscreenImage, setFullscreenImage] = useState(null); // single image path for fullscreen

  // Format file size helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper for document icons
  const renderDocIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="text-pink-400" size={16} />;
      case 'pdf':
        return <FileText className="text-red-400" size={16} />;
      case 'word':
        return <FileText className="text-blue-400" size={16} />;
      case 'excel':
        return <FileSpreadsheet className="text-green-400" size={16} />;
      case 'archive':
        return <FileArchive className="text-amber-400" size={16} />;
      default:
        return <FileCheck className="text-indigo-400" size={16} />;
    }
  };

  // Sync profile when user context updates
  useEffect(() => {
    if (user) {
      setProfile(prev => ({ ...(prev || {}), ...user }));
    }
  }, [user]);

  // Fetch full intern profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/intern/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setProfile(data);
        if (updateUser) {
          updateUser(data);
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/intern/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/intern/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/intern/auth');
      return;
    }
    fetchProfile();
    fetchStats();
    fetchTasks();
  }, [token, activeTab]);

  // Handle task status update (Pending / Completed)
  const toggleTaskStatus = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${API_BASE}/api/intern/tasks/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: nextStatus } : t));
        fetchStats();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle file selection (supports images, documents, archives)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setError('');

    // Generate previews for image files
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  // Submit deliverables & proof of work for this task (attachments & notes are optional)
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 && !submissionNote.trim() && !markCompletedOnSubmit) {
      setError('Please enter a note or attach files for your submission.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadLoading(true);

    try {
      let res;
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('notes', submissionNote.trim());
        formData.append('markCompleted', markCompletedOnSubmit);

        res = await fetch(`${API_BASE}/api/intern/tasks/${uploadTaskId}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else {
        res = await fetch(`${API_BASE}/api/intern/tasks/${uploadTaskId}/upload`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            notes: submissionNote.trim(),
            markCompleted: markCompletedOnSubmit
          })
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      
      setSuccess(data.message || 'Work submitted successfully for this task!');
      
      // Update local task state
      setTasks(tasks.map(t => t._id === uploadTaskId ? { 
        ...t, 
        images: data.images || t.images,
        documents: data.documents || t.documents,
        submissionNote: data.submissionNote || submissionNote.trim() || t.submissionNote,
        status: markCompletedOnSubmit ? 'Completed' : t.status
      } : t));
      
      setSelectedFiles([]);
      setPreviews([]);
      setSubmissionNote('');
      setUploadTaskId(null);
      fetchStats();
      fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentEmail = profile?.email || user?.email || '';
  const currentPhone = profile?.phone || user?.phone || '';
  const currentName = profile?.fullName || user?.fullName || 'Intern';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* =========================================================
          SIDEBAR
          ========================================================= */}
      <aside className="w-full md:w-64 glass border-r border-slate-900 flex flex-col justify-between p-6 md:sticky md:top-0 md:h-screen z-40">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 border-b border-slate-900 pb-6">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-auto bg-white/10 p-1 rounded" />
            <span className="font-bold tracking-wider text-slate-200">Datayug Intern</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setUploadTaskId(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => { setActiveTab('tasks'); setUploadTaskId(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <CheckSquare size={20} />
              <span>My Tasks</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout in Sidebar */}
        <div className="mt-8 md:mt-0 pt-6 border-t border-slate-900 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold flex-shrink-0 text-base">
              {currentName ? currentName[0].toUpperCase() : 'I'}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Logged In Intern</p>
              <p className="text-sm font-bold truncate text-slate-100">{currentName}</p>
              <p className="text-xs text-slate-400 truncate">{currentEmail}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-950/20 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN WORKSPACE
          ========================================================= */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* Header Title */}
        <header className="mb-8 flex items-center justify-between border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight capitalize text-white">
              {activeTab === 'tasks' ? 'My Assigned Tasks' : 'Intern Overview'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'dashboard' && 'Your profile details, assigned work, and milestone progress'}
              {activeTab === 'tasks' && 'Review assigned tasks, download admin attachments, and send documents/media proof'}
            </p>
          </div>
        </header>

        {/* =========================================================
            TAB CONTENT: DASHBOARD HOME
            ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-page-enter">
            
            {/* Student Profile Card (Department & College removed per specification) */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Header inside Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Verified Intern
                    </span>
                    <span className="text-xs text-slate-400">• Datayug Society</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                    Welcome back, {currentName}!
                  </h2>
                </div>
                <div className="self-start sm:self-center">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <UserCheck size={14} />
                    <span>Account Active</span>
                  </span>
                </div>
              </div>

              {/* CONTACT DETAILS CARDS: EMAIL & PHONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                
                {/* Email Address */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3.5 hover:border-indigo-500/40 transition-all">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                    <Mail size={22} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <span className="text-sm font-extrabold text-white block mt-0.5 break-words">
                      {currentEmail || 'Not Provided'}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3.5 hover:border-emerald-500/40 transition-all">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                    <Phone size={22} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
                    <span className="text-sm font-extrabold text-white block mt-0.5 break-words">
                      {currentPhone || 'Not Provided'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Assigned Tasks */}
              <div className="glass-card rounded-2xl p-6 flex items-center justify-between border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Tasks</span>
                  <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <CheckSquare size={22} />
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="glass-card rounded-2xl p-6 flex items-center justify-between border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
                  <p className="text-3xl font-bold text-green-400">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-600/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <CheckCircle2 size={22} />
                </div>
              </div>

              {/* Pending Tasks */}
              <div className="glass-card rounded-2xl p-6 flex items-center justify-between border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
                  <p className="text-3xl font-bold text-amber-400">{stats.pendingTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock size={22} />
                </div>
              </div>
            </div>

            {/* Quick Action to Assigned Tasks */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">View Your Assigned Tasks & Resources</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Check tasks, download admin attachments, submit progress, and send documents or media proofs.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2 flex-shrink-0"
              >
                <span>Go to My Tasks</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        )}

        {/* =========================================================
            TAB CONTENT: MY TASKS (SEND DOCUMENT & MEDIA IN ASSIGN TASK)
            ========================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-page-enter">
            
            {/* Identity Bar */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-white">{currentName}</span>
                {currentPhone && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-semibold">{currentPhone}</span>
                  </>
                )}
                {currentEmail && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{currentEmail}</span>
                  </>
                )}
              </div>
              <span className="text-slate-500">{tasks.length} Assigned Task{tasks.length !== 1 ? 's' : ''}</span>
            </div>

            {tasks.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-slate-800/85">
                No tasks have been assigned to you yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map((task) => (
                  <div key={task._id} className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all duration-300">
                    
                    <div className="space-y-3">
                      {/* Header with Title and status toggle */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-bold text-white leading-snug">{task.title}</h3>
                        <button 
                          onClick={() => toggleTaskStatus(task._id, task.status)}
                          className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer select-none transition-all ${
                            task.status === 'Completed' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {task.status === 'Completed' ? 'Completed' : 'Pending'}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
                      
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-1">
                        <Calendar size={13} />
                        <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Resources & Documents attached by Admin for this task */}
                    {task.documents && task.documents.filter(d => d.uploadedBy === 'admin').length > 0 && (
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Paperclip size={13} />
                          <span>Resources & Attachments from Admin</span>
                        </span>
                        <div className="space-y-1.5">
                          {task.documents.filter(d => d.uploadedBy === 'admin').map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                              <div className="flex items-center space-x-2 overflow-hidden mr-2">
                                {renderDocIcon(doc.fileType)}
                                <span className="truncate text-slate-200" title={doc.originalName}>
                                  {doc.originalName}
                                </span>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                  ({formatBytes(doc.fileSize)})
                                </span>
                              </div>
                              <a 
                                href={getFileUrl(doc.path)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download
                                className="text-purple-400 hover:text-purple-300 font-semibold flex-shrink-0 flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20"
                              >
                                <Download size={11} />
                                <span>Download</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Intern Submissions: Documents & Media proof sent for this task */}
                    {task.documents && task.documents.filter(d => d.uploadedBy === 'intern').length > 0 && (
                      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2">
                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <FileCheck size={13} />
                          <span>Your Submissions & Proofs</span>
                        </span>
                        <div className="space-y-1.5">
                          {task.documents.filter(d => d.uploadedBy === 'intern').map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                              <div className="flex items-center space-x-2 overflow-hidden mr-2">
                                {renderDocIcon(doc.fileType)}
                                <span className="truncate text-slate-200" title={doc.originalName}>
                                  {doc.originalName}
                                </span>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                  ({formatBytes(doc.fileSize)})
                                </span>
                              </div>
                              <a 
                                href={getFileUrl(doc.path)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download
                                className="text-blue-400 hover:text-blue-300 font-semibold flex-shrink-0 flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
                              >
                                <Download size={11} />
                                <span>View</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshot Proofs Thumbnail Gallery */}
                    {task.images && task.images.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Proof Screenshots:</span>
                        <button 
                          onClick={() => setPreviewImagesModal(task.images)}
                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <ImageIcon size={14} />
                          <span>{task.images.length} Image Proofs</span>
                        </button>
                      </div>
                    )}

                    {/* Intern Work Notes / Remarks if present */}
                    {task.submissionNote && (
                      <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Your Submission Notes:</span>
                        <p className="text-xs text-slate-200 leading-relaxed">{task.submissionNote}</p>
                      </div>
                    )}

                    {/* Task Action Buttons */}
                    <div className="pt-3 border-t border-slate-900 flex items-center space-x-2">
                      <button 
                        onClick={() => toggleTaskStatus(task._id, task.status)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all border border-slate-700"
                      >
                        {task.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed'}
                      </button>
                      
                      {/* Submit Work / Deliverables for this task (Optional files) */}
                      <button 
                        onClick={() => { 
                          setUploadTaskId(task._id); 
                          setError(''); 
                          setSuccess(''); 
                          setSelectedFiles([]); 
                          setPreviews([]); 
                          setSubmissionNote(task.submissionNote || '');
                          setMarkCompletedOnSubmit(task.status !== 'Completed');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-md hover:shadow-blue-500/15 flex items-center justify-center space-x-1.5"
                      >
                        <Upload size={14} />
                        <span>Submit Work / Proof</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            SUBMIT WORK / PROOF OVERLAY MODAL (FOR TASK) - OPTIONAL ATTACHMENTS
            ========================================================= */}
        {uploadTaskId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg glass-card rounded-2xl border border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              
              <button 
                onClick={() => { setUploadTaskId(null); setSelectedFiles([]); setPreviews([]); setSubmissionNote(''); }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Submit Work & Deliverables</h3>
              <p className="text-xs text-slate-400 mb-6">
                Submit progress remarks, work notes, or deliverables. File attachments are completely optional.
              </p>

              {/* Feedback inside modal */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={14} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                
                {/* Work Notes / Deliverables Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="intern-submission-notes" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Work Notes / Deliverables Summary
                    </label>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <textarea 
                    id="intern-submission-notes"
                    rows={3}
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    className="w-full glass-input resize-none text-xs text-slate-100 placeholder-slate-500"
                    placeholder="Describe your progress, deliverables, links to repository, or comments for the admin..."
                  />
                </div>

                {/* File picker drop area (OPTIONAL) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Attach Documents or Media Proof
                    </label>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50"
                  >
                    <input 
                      type="file" 
                      multiple 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.webp,.gif"
                      className="hidden" 
                    />
                    <Upload className="text-blue-400 mb-2" size={24} />
                    <span className="text-xs font-semibold text-slate-300">Click to choose document or media files</span>
                    <span className="text-[11px] text-slate-500 mt-1 text-center">
                      PDFs, Word, Excel, PowerPoint, ZIP, RAR, or Images (Max 25MB each)
                    </span>
                  </div>
                </div>

                {/* Selected Files summary list */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Selected Files ({selectedFiles.length})
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setSelectedFiles([]); setPreviews([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Clear files
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto p-2 border border-slate-900 rounded-lg bg-slate-950/40">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="truncate max-w-[280px]">{file.name}</span>
                          <span className="text-slate-500">{formatBytes(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instant Image Previews if any images selected */}
                {previews.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image Previews</span>
                    <div className="grid grid-cols-4 gap-3 max-h-24 overflow-y-auto p-1 border border-slate-900 rounded-lg">
                      {previews.map((preview, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-800 relative">
                          <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Status Update Checkbox */}
                <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer select-none py-1">
                  <input 
                    type="checkbox"
                    checked={markCompletedOnSubmit}
                    onChange={(e) => setMarkCompletedOnSubmit(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span>Mark this task as Completed upon submission</span>
                </label>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={uploadLoading || (selectedFiles.length === 0 && !submissionNote.trim() && !markCompletedOnSubmit)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{uploadLoading ? 'Submitting Deliverables...' : (selectedFiles.length > 0 ? 'Submit Work with Attachments' : 'Submit Work')}</span>
                </button>

              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            PROOFS GALLERY MODAL (IMAGE PREVIEWS)
            ========================================================= */}
        {previewImagesModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl glass-card rounded-2xl border border-slate-800 shadow-2xl p-6 relative max-h-[80vh] flex flex-col">
              
              <button 
                onClick={() => setPreviewImagesModal(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Submitted Proof Screenshots</h3>
              <p className="text-xs text-slate-500 mb-6">Gallery of screenshots uploaded for this task.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto flex-1 p-1">
                {previewImagesModal.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setFullscreenImage(getFileUrl(img.path))}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-slate-600 cursor-pointer transition-all relative group"
                  >
                    <img 
                      src={getFileUrl(img.path)} 
                      alt="Submitted proof of work" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px]">
                      <p className="text-white truncate font-medium">Uploaded at:</p>
                      <p className="text-slate-400 truncate">{new Date(img.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FULL SCREEN IMAGE PREVIEW MODAL
            ========================================================= */}
        {fullscreenImage && (
          <div className="fixed inset-0 bg-slate-950/95 z-55 flex items-center justify-center p-4">
            <button 
              onClick={() => setFullscreenImage(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
            >
              <X size={24} />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg border border-slate-900 shadow-2xl"
            />
          </div>
        )}

      </main>

    </div>
  );
};

export default InternDashboard;
