import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarPlus, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Shield, 
  X, 
  Calendar, 
  AlertCircle,
  FileText,
  Download,
  Paperclip,
  Upload,
  FileSpreadsheet,
  FileArchive,
  FileCheck,
  Image as ImageIcon,
  Building2,
  GraduationCap,
  Phone,
  Mail,
  PlusCircle
} from 'lucide-react';
import { API_BASE, getFileUrl } from '../config';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'interns', 'assign'
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalInterns: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  // Data lists
  const [interns, setInterns] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedInternProfile, setSelectedInternProfile] = useState(null); // For progress view modal
  
  // Assign task form with document/media attachment
  const [taskForm, setTaskForm] = useState({
    internId: '',
    title: '',
    description: '',
    deadline: ''
  });
  const [taskAttachment, setTaskAttachment] = useState(null);
  const taskAttachmentInputRef = useRef(null);

  // Quick attach modal to an existing task
  const [quickAttachTaskId, setQuickAttachTaskId] = useState(null);
  const [quickAttachFile, setQuickAttachFile] = useState(null);
  const [quickAttachLoading, setQuickAttachLoading] = useState(false);
  const quickAttachInputRef = useRef(null);

  // UI feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For fullscreen image preview

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

  // Fetch stats and interns data
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInterns = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/interns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setInterns(data);
        // Pre-select if there is only 1 intern and none selected yet
        if (data.length === 1) {
          setTaskForm(prev => prev.internId ? prev : { ...prev, internId: (data[0]._id || data[0].id) });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/auth');
      return;
    }
    fetchStats();
    fetchInterns();
    if (activeTab === 'assign') {
      fetchAllTasks();
    }
  }, [token, activeTab]);

  // Handle task assignment (attachments are completely optional)
  const handleAssignTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!taskForm.internId) {
      setError('Please select an intern from the dropdown list.');
      return;
    }
    if (!taskForm.title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    if (!taskForm.description.trim()) {
      setError('Please provide a task description.');
      return;
    }
    if (!taskForm.deadline) {
      setError('Please select a deadline date.');
      return;
    }

    setFormLoading(true);

    try {
      let res;
      if (taskAttachment) {
        // Send multipart form data with attachment
        const formData = new FormData();
        formData.append('internId', taskForm.internId);
        formData.append('title', taskForm.title.trim());
        formData.append('description', taskForm.description.trim());
        formData.append('deadline', taskForm.deadline);
        formData.append('attachment', taskAttachment);

        res = await fetch(`${API_BASE}/api/admin/tasks/assign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Send clean standard JSON when no file attachment
        res = await fetch(`${API_BASE}/api/admin/tasks/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            internId: taskForm.internId,
            title: taskForm.title.trim(),
            description: taskForm.description.trim(),
            deadline: taskForm.deadline
          })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign task');
      
      setSuccess(data.message || 'Task assigned successfully!');
      // Reset form but retain single intern selection if only 1 intern exists
      setTaskForm({
        internId: interns.length === 1 ? (interns[0]._id || interns[0].id) : '',
        title: '',
        description: '',
        deadline: ''
      });
      setTaskAttachment(null);
      if (taskAttachmentInputRef.current) taskAttachmentInputRef.current.value = '';
      
      fetchStats();
      fetchAllTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Quick attach file to existing task in Assign Tasks tab
  const handleQuickAttach = async (e) => {
    e.preventDefault();
    if (!quickAttachFile || !quickAttachTaskId) return;

    setQuickAttachLoading(true);
    const formData = new FormData();
    formData.append('file', quickAttachFile);

    try {
      const res = await fetch(`${API_BASE}/api/admin/tasks/${quickAttachTaskId}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setQuickAttachTaskId(null);
      setQuickAttachFile(null);
      if (quickAttachInputRef.current) quickAttachInputRef.current.value = '';
      fetchAllTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setQuickAttachLoading(false);
    }
  };

  // View intern profile details & tasks
  const viewProfile = async (internId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/interns/${internId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedInternProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete intern
  const deleteIntern = async (internId) => {
    if (!window.confirm('Are you sure you want to delete this intern? This will delete all their assigned tasks and submitted proofs.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/interns/${internId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInterns(interns.filter(i => i._id !== internId));
        if (selectedInternProfile?.intern?._id === internId) {
          setSelectedInternProfile(null);
        }
        fetchStats();
        fetchAllTasks();
      } else {
        alert(data.message || 'Failed to delete intern');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <span className="font-bold tracking-wider text-slate-200">Datayug Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedInternProfile(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => { setActiveTab('interns'); setSelectedInternProfile(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'interns' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <Users size={20} />
              <span>Interns</span>
            </button>

            <button 
              onClick={() => { setActiveTab('assign'); setSelectedInternProfile(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'assign' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
            >
              <CalendarPlus size={20} />
              <span>Assign Tasks</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="mt-8 md:mt-0 pt-6 border-t border-slate-900 flex flex-col space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Logged In As</p>
              <p className="text-sm font-semibold truncate text-slate-200">{user?.email}</p>
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
              {activeTab === 'assign' ? 'Assign Tasks' : activeTab}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'dashboard' && 'Overview of internship workspace metrics'}
              {activeTab === 'interns' && 'Manage all registered interns, view college, dept, and progress'}
              {activeTab === 'assign' && 'Assign tasks to interns (attachments optional), set deadlines, and review submissions'}
            </p>
          </div>
        </header>

        {/* =========================================================
            TAB CONTENT: DASHBOARD OVERVIEW
            ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-page-enter">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Interns */}
              <div className="glass-card rounded-2xl p-6 flex items-center justify-between border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Interns</span>
                  <p className="text-3xl font-bold text-white">{stats.totalInterns}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users size={22} />
                </div>
              </div>

              {/* Total Tasks */}
              <div className="glass-card rounded-2xl p-6 flex items-center justify-between border border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
                  <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CalendarPlus size={22} />
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

            {/* Quick overview layout */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-lg font-bold text-white mb-3">Welcome to Datayug Admin Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                From this management center, you can monitor registered interns, assign milestone tasks along with reference documents or media, and inspect uploaded proof screenshots and documents. Click on <strong className="text-slate-200">Assign Tasks</strong> to assign tasks and send media/documents to interns.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB CONTENT: INTERNS TABLE
            ========================================================= */}
        {activeTab === 'interns' && (
          <div className="space-y-6 animate-page-enter">
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">College</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-sm">
                    {interns.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          No registered interns found.
                        </td>
                      </tr>
                    ) : (
                      interns.map((intern) => (
                        <tr key={intern._id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{intern.fullName}</td>
                          <td className="px-6 py-4 text-slate-400">{intern.email}</td>
                          <td className="px-6 py-4 text-slate-300 font-medium">{intern.college}</td>
                          <td className="px-6 py-4 text-blue-400">{intern.department}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              intern.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                              intern.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {intern.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-3">
                              <button 
                                onClick={() => viewProfile(intern._id)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-white transition-all text-xs font-semibold border border-blue-500/20"
                              >
                                <Eye size={14} />
                                <span>Profile & Tasks</span>
                              </button>
                              <button 
                                onClick={() => deleteIntern(intern._id)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-white transition-all text-xs font-semibold border border-red-500/20"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
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
          </div>
        )}

        {/* =========================================================
            TAB CONTENT: ASSIGN TASK & SEND DOCUMENTS / MEDIA
            ========================================================= */}
        {activeTab === 'assign' && (
          <div className="space-y-10 animate-page-enter">
            
            {/* Task Assignment Form with Document/Media Attachment */}
            <div className="max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl p-8 border border-slate-800/80 shadow-2xl">
                
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-900">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CalendarPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Assign Task</h2>
                    <p className="text-xs text-slate-400">Set task details and deadlines (attachments are completely optional)</p>
                  </div>
                </div>

                {/* Feedback messages */}
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-2">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-start space-x-2">
                    <CheckCircle2 className="flex-shrink-0 mt-0.5" size={16} />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleAssignTask} className="space-y-6">
                  
                  {/* Select Intern */}
                  <div>
                    <label htmlFor="assign-intern" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Intern</label>
                    <select 
                      id="assign-intern"
                      required
                      value={taskForm.internId}
                      onChange={(e) => setTaskForm({ ...taskForm, internId: e.target.value })}
                      className="w-full glass-input text-sm"
                    >
                      <option value="" className="bg-slate-950">
                        {interns.length === 0 ? '-- No Interns Registered Yet --' : '-- Select Intern --'}
                      </option>
                      {interns.map(i => {
                        const id = i._id || i.id;
                        return (
                          <option key={id} value={id} className="bg-slate-950">
                            {i.fullName} ({i.department || 'General'} - {i.college || 'Institution'})
                          </option>
                        );
                      })}
                    </select>
                    {interns.length === 0 && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center space-x-1.5">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>No interns registered yet. Once an intern registers, they will appear in this dropdown.</span>
                      </p>
                    )}
                  </div>

                  {/* Task Title */}
                  <div>
                    <label htmlFor="assign-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                    <input 
                      type="text" 
                      id="assign-title"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full glass-input text-sm"
                      placeholder="e.g. Develop React Component Architecture"
                    />
                  </div>

                  {/* Task Description */}
                  <div>
                    <label htmlFor="assign-desc" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Description</label>
                    <textarea 
                      id="assign-desc"
                      required
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full glass-input resize-none text-sm"
                      placeholder="Provide detailed instructions, milestones, or deliverables..."
                    />
                  </div>

                  {/* Deadline Date */}
                  <div>
                    <label htmlFor="assign-deadline" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deadline Date</label>
                    <input 
                      type="date" 
                      id="assign-deadline"
                      required
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      className="w-full glass-input text-sm"
                    />
                  </div>

                  {/* Send Document or Media (Attached with the task - OPTIONAL) */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Paperclip size={16} className="text-blue-400" />
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Attach Reference Document or Media
                        </label>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Optional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Optional — attach project files, PDFs, instructions, or reference images. You can assign the task without any attachment.
                    </p>
                    <input 
                      type="file" 
                      ref={taskAttachmentInputRef}
                      onChange={(e) => setTaskAttachment(e.target.files[0] || null)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.webp,.gif"
                      className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 file:cursor-pointer glass-input cursor-pointer"
                    />
                    {taskAttachment && (
                      <div className="flex items-center justify-between text-xs text-blue-400 pt-1">
                        <span>Selected: {taskAttachment.name} ({formatBytes(taskAttachment.size)})</span>
                        <button 
                          type="button" 
                          onClick={() => { setTaskAttachment(null); if (taskAttachmentInputRef.current) taskAttachmentInputRef.current.value = ''; }}
                          className="text-slate-400 hover:text-red-400 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Error above button */}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                      <AlertCircle className="flex-shrink-0 mt-0.5" size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Assign Button */}
                  <button 
                    type="submit"
                    disabled={formLoading || interns.length === 0}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{formLoading ? 'Assigning Task...' : (taskAttachment ? 'Assign Task with Attachment' : 'Assign Task')}</span>
                  </button>

                </form>

              </div>
            </div>

            {/* List of Assigned Tasks with Attachments & Submissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Recently Assigned Tasks & Documents</h3>
                  <p className="text-xs text-slate-400">Review assigned tasks, attached resources, and student proof submissions</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  {allTasks.length} Task{allTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {allTasks.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 text-center text-slate-500 border border-slate-800/80">
                  No tasks assigned yet. Use the form above to assign your first task!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allTasks.map((t) => (
                    <div key={t._id} className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-2">
                        {/* Header with Title and Intern Name */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-base leading-snug">{t.title}</h4>
                            <p className="text-xs text-blue-400 font-medium mt-0.5">
                              Assigned to: {t.internDetails?.fullName || 'Intern'} ({t.internDetails?.department || 'Department'})
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                        
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-1">
                          <Calendar size={13} />
                          <span>Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                        </div>

                        {/* Intern Work Notes / Remarks if submitted */}
                        {t.submissionNote && (
                          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 space-y-1">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Intern Remarks / Work Note</span>
                            <p className="text-xs text-slate-200 leading-relaxed">{t.submissionNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Documents / Media Attached or Submitted */}
                      {t.documents && t.documents.length > 0 && (
                        <div className="pt-3 border-t border-slate-900 space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Files & Media ({t.documents.length})
                          </span>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {t.documents.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                                <div className="flex items-center space-x-2 overflow-hidden mr-2">
                                  {renderDocIcon(doc.fileType)}
                                  <span className="truncate text-slate-200" title={doc.originalName}>
                                    {doc.originalName}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    doc.uploadedBy === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                  }`}>
                                    {doc.uploadedBy === 'admin' ? 'From You' : 'From Intern'}
                                  </span>
                                </div>
                                <a 
                                  href={getFileUrl(doc.path)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  download
                                  className="text-blue-400 hover:text-blue-300 flex-shrink-0 flex items-center space-x-1 text-xs"
                                >
                                  <Download size={12} />
                                  <span>View</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Proof Images Gallery thumbnails if present */}
                      {t.images && t.images.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Screenshot Proofs ({t.images.length})
                          </span>
                          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                            {t.images.map((img, i) => (
                              <div 
                                key={i} 
                                onClick={() => setSelectedImage(getFileUrl(img.path))}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800 cursor-pointer flex-shrink-0 relative group"
                              >
                                <img src={getFileUrl(img.path)} alt="Proof" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Send Document Button to this specific task */}
                      <div className="pt-2 border-t border-slate-900 flex justify-end">
                        <button
                          onClick={() => { setQuickAttachTaskId(t._id); setQuickAttachFile(null); }}
                          className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-semibold py-1 px-2.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all"
                        >
                          <PlusCircle size={13} />
                          <span>Attach Document / Media</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================
            ADMIN VIEW: INTERN PROFILE & TASKS MODAL (NO DETACHED DOCS)
            ========================================================= */}
        {selectedInternProfile && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] glass-card rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-float">
              
              {/* Modal Header with Profile Info */}
              <div className="p-6 border-b border-slate-900 bg-slate-950/60 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                    Intern Profile & Tasks
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5">{selectedInternProfile.intern.fullName}</h3>
                  
                  {/* Detailed Info Chips */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                    <span className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <GraduationCap size={14} className="text-indigo-400" />
                      <span>{selectedInternProfile.intern.college}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Building2 size={14} className="text-blue-400" />
                      <span>{selectedInternProfile.intern.department}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Mail size={14} className="text-emerald-400" />
                      <span>{selectedInternProfile.intern.email}</span>
                    </span>
                    {selectedInternProfile.intern.phone && (
                      <span className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <Phone size={14} className="text-amber-400" />
                        <span>{selectedInternProfile.intern.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedInternProfile(null)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Assigned Tasks and Submissions */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Assigned Tasks ({selectedInternProfile.tasks.length})
                </h4>

                {selectedInternProfile.tasks.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">No tasks assigned to this intern yet.</p>
                ) : (
                  <div className="space-y-6">
                    {selectedInternProfile.tasks.map((task) => (
                      <div key={task._id} className="p-5 glass rounded-xl border border-slate-800/80 space-y-4">
                        {/* Task Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="font-bold text-white text-base">{task.title}</h5>
                            <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 self-start sm:self-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              task.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Calendar size={14} />
                          <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>

                        {/* Documents & Media Attached or Submitted */}
                        {task.documents && task.documents.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Attached Documents & Media Submissions ({task.documents.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {task.documents.map((doc, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-2 overflow-hidden mr-2">
                                    {renderDocIcon(doc.fileType)}
                                    <div className="overflow-hidden">
                                      <p className="text-white truncate font-medium">{doc.originalName}</p>
                                      <p className="text-[10px] text-slate-500">
                                        {formatBytes(doc.fileSize)} • {doc.uploadedBy === 'admin' ? 'Attached by Admin' : 'Submitted by Intern'}
                                      </p>
                                    </div>
                                  </div>
                                  <a 
                                    href={getFileUrl(doc.path)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    download
                                    className="p-1.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-white flex-shrink-0"
                                  >
                                    <Download size={13} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proof Screenshots Gallery */}
                        {task.images && task.images.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Screenshot Proof Submissions ({task.images.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                              {task.images.map((img, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => setSelectedImage(getFileUrl(img.path))}
                                  className="aspect-square rounded-lg overflow-hidden border border-slate-800 hover:border-slate-600 transition-all cursor-pointer relative group"
                                >
                                  <img 
                                    src={getFileUrl(img.path)} 
                                    alt={task.title} 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px]">
                                    <p className="text-white truncate font-medium">Uploaded at:</p>
                                    <p className="text-slate-400 truncate">{new Date(img.uploadedAt).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            QUICK ATTACH MODAL (FROM ASSIGN TASKS TAB)
            ========================================================= */}
        {quickAttachTaskId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card rounded-2xl border border-slate-800 shadow-2xl p-6 relative">
              <button 
                onClick={() => setQuickAttachTaskId(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
              >
                <X size={16} />
              </button>
              <h3 className="text-base font-bold text-white mb-2">Attach Document or Media to Task</h3>
              <p className="text-xs text-slate-400 mb-4">Send a reference file, document, or media asset directly to this task.</p>
              
              <form onSubmit={handleQuickAttach} className="space-y-4">
                <input 
                  type="file"
                  ref={quickAttachInputRef}
                  onChange={(e) => setQuickAttachFile(e.target.files[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.webp,.gif"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 file:cursor-pointer glass-input cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={quickAttachLoading || !quickAttachFile}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Upload size={14} />
                  <span>{quickAttachLoading ? 'Uploading...' : 'Send Attachment to Task'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            FULL SCREEN IMAGE PREVIEW MODAL
            ========================================================= */}
        {selectedImage && (
          <div className="fixed inset-0 bg-slate-950/95 z-55 flex items-center justify-center p-4">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg border border-slate-900 shadow-2xl"
            />
          </div>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;
