const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Admin = require('../models/Admin');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer File Filter for Shared Documents & Media
const documentFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.rar'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File format not supported. Supported: PDF, Word, Excel, PowerPoint, Text, ZIP, and Images.'));
  }
};

const documentUpload = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Helper to determine human-readable file category
function getFileTypeCategory(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.ppt', '.pptx'].includes(ext)) return 'powerpoint';
  if (['.zip', '.rar'].includes(ext)) return 'archive';
  return 'document';
}

// POST /api/admin/signup - Register the ONLY admin
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if an admin already exists
    const adminExists = await Admin.findOne();
    if (adminExists) {
      return res.status(400).json({ message: 'Admin account already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the admin
    const newAdmin = new Admin({
      email,
      password: hashedPassword
    });

    await newAdmin.save();

    // Create JWT token
    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email, role: 'admin' },
      process.env.JWT_SECRET || 'datayug_internship_management_system_secure_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: { id: newAdmin._id, email: newAdmin.email }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'datayug_internship_management_system_secure_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: { id: admin._id, email: admin.email }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/admin/check-exists - Check if admin already exists (for frontend UI)
router.get('/check-exists', async (req, res) => {
  try {
    const adminExists = await Admin.findOne();
    res.json({ exists: !!adminExists });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats - Admin stats (Total Interns, Total Tasks, Completed Tasks, Pending Tasks)
router.get('/stats', auth('admin'), async (req, res) => {
  try {
    const totalInterns = await Intern.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });

    res.json({
      totalInterns,
      totalTasks,
      completedTasks,
      pendingTasks
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// GET /api/admin/interns - List all registered interns
router.get('/interns', auth('admin'), async (req, res) => {
  try {
    const interns = await Intern.find().select('-password');
    // Map with their status - if they have any tasks, check if all tasks are completed
    const internsWithStatus = await Promise.all(interns.map(async (intern) => {
      const internId = intern._id || intern.id;
      const tasks = await Task.find({ intern: internId });
      let status = 'No Tasks';
      if (tasks && tasks.length > 0) {
        const completedCount = tasks.filter(t => t.status === 'Completed').length;
        status = completedCount === tasks.length ? 'Completed' : 'Pending';
      }
      const internObj = typeof intern.toObject === 'function' ? intern.toObject() : { ...intern };
      return {
        ...internObj,
        _id: internId,
        status
      };
    }));

    res.json(internsWithStatus);
  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({ message: 'Server error fetching interns' });
  }
});

// GET /api/admin/interns/:id - View profile of specific intern
router.get('/interns/:id', auth('admin'), async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id).select('-password');
    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const tasks = await Task.find({ intern: intern._id || intern.id || req.params.id }).sort({ createdAt: -1 });

    res.json({
      intern,
      tasks
    });
  } catch (error) {
    console.error('Get intern profile error:', error);
    res.status(500).json({ message: 'Server error fetching intern profile' });
  }
});

// DELETE /api/admin/interns/:id - Delete an intern and their tasks & documents
router.delete('/interns/:id', auth('admin'), async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    await Intern.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ intern: req.params.id });
    await Document.deleteMany({ intern: req.params.id });

    res.json({ message: 'Intern and all assigned tasks/documents deleted successfully' });
  } catch (error) {
    console.error('Delete intern error:', error);
    res.status(500).json({ message: 'Server error deleting intern' });
  }
});

// GET /api/admin/tasks - List all assigned tasks with intern details and attachments
router.get('/tasks', auth('admin'), async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    const tasksWithInterns = await Promise.all(tasks.map(async (task) => {
      const taskObj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
      const intern = await Intern.findById(task.intern);
      taskObj.internDetails = intern ? {
        id: intern._id || intern.id,
        fullName: intern.fullName,
        email: intern.email,
        college: intern.college,
        department: intern.department
      } : null;
      return taskObj;
    }));

    res.json(tasksWithInterns);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// Helper to process task assignment logic
async function processAssignTask(req, res) {
  try {
    const { internId, title, description, deadline } = req.body || {};

    if (!internId || !title || !description || !deadline) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'All task fields (intern, title, description, deadline) are required' });
    }

    let intern = await Intern.findById(internId);
    if (!intern) {
      intern = await Intern.findOne({ _id: internId });
    }
    if (!intern) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Selected intern was not found. Please refresh and select an intern.' });
    }

    const documents = [];
    const images = [];

    if (req.file) {
      const fileCat = getFileTypeCategory(req.file.originalname);
      const docObj = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        fileType: fileCat,
        fileSize: req.file.size,
        uploadedBy: 'admin',
        uploadedAt: new Date()
      };
      documents.push(docObj);

      if (fileCat === 'image') {
        images.push({
          filename: req.file.filename,
          path: `/uploads/${req.file.filename}`,
          uploadedAt: new Date()
        });
      }
    }

    const resolvedInternId = intern._id || intern.id || internId;

    const newTask = new Task({
      title: title.trim(),
      description: description.trim(),
      deadline,
      intern: resolvedInternId,
      status: 'Pending',
      images,
      documents
    });

    await newTask.save();

    return res.status(201).json({
      message: 'Task assigned successfully' + (req.file ? ' with document attachment!' : '!'),
      task: newTask
    });
  } catch (error) {
    console.error('Task assignment error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ message: error.message || 'Server error assigning task' });
  }
}

// POST /api/admin/tasks/assign - Assign a task (attachment is completely optional)
router.post('/tasks/assign', auth('admin'), (req, res) => {
  const isMultipart = req.is('multipart/form-data') || (req.headers['content-type'] && req.headers['content-type'].includes('multipart'));
  if (isMultipart) {
    documentUpload.single('attachment')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      processAssignTask(req, res);
    });
  } else {
    processAssignTask(req, res);
  }
});

// POST /api/admin/tasks/:id/documents - Admin attaches document/media to an existing assigned task
router.post('/tasks/:id/documents', auth('admin'), (req, res) => {
  documentUpload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please select a document or media file to attach.' });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Task not found' });
      }

      task.documents = task.documents || [];
      const fileCat = getFileTypeCategory(req.file.originalname);
      const docObj = {
        filename: req.file.filename,
        originalName: req.body.title || req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        fileType: fileCat,
        fileSize: req.file.size,
        uploadedBy: 'admin',
        uploadedAt: new Date()
      };

      task.documents.push(docObj);

      if (fileCat === 'image') {
        task.images = task.images || [];
        task.images.push({
          filename: req.file.filename,
          path: `/uploads/${req.file.filename}`,
          uploadedAt: new Date()
        });
      }

      await task.save();

      res.json({
        message: 'Document/Media attachment added to task successfully!',
        task
      });
    } catch (error) {
      console.error('Task document upload error:', error);
      res.status(500).json({ message: 'Server error uploading task attachment' });
    }
  });
});

// =========================================================
// SHARED DOCUMENTS & MEDIA ROUTES (ADMIN <-> STUDENT EXCHANGE)
// =========================================================

// POST /api/admin/interns/:id/documents - Admin sends a document/media to an intern
router.post('/interns/:id/documents', auth('admin'), (req, res) => {
  documentUpload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please select a document or media file to upload.' });
      }

      const intern = await Intern.findById(req.params.id);
      if (!intern) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Intern not found' });
      }

      const title = req.body.title || req.file.originalname;

      const newDoc = new Document({
        intern: req.params.id,
        sender: 'admin',
        senderName: 'Admin / Datayug',
        title: title,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: getFileTypeCategory(req.file.originalname),
        fileSize: req.file.size
      });

      await newDoc.save();

      res.status(201).json({
        message: 'Document shared with student successfully!',
        document: newDoc
      });
    } catch (error) {
      console.error('Admin document upload error:', error);
      res.status(500).json({ message: 'Server error uploading document' });
    }
  });
});

// GET /api/admin/interns/:id/documents - Admin gets all documents shared between Admin & specific Intern
router.get('/interns/:id/documents', auth('admin'), async (req, res) => {
  try {
    const docs = await Document.find({ intern: req.params.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Fetch intern documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

// DELETE /api/admin/documents/:id - Delete a shared document
router.delete('/documents/:id', auth('admin'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Try removing file from disk if it exists
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

module.exports = router;
