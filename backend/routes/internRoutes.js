const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { createStorage } = require('../database/fileStorage');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (local disk, or Supabase Storage when configured)
const storage = createStorage(uploadDir);

// Multer File Filter for Screenshots (Images only)
const imageFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'));
  }
};

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

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

// POST /api/intern/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, phone, college, department, password, confirmPassword } = req.body;

    if (!fullName || !email || !phone || !college || !department || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const emailExists = await Intern.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save Intern with full details
    const newIntern = new Intern({
      fullName,
      email: email.toLowerCase(),
      phone,
      college,
      department,
      password: hashedPassword
    });

    await newIntern.save();

    // Create Token
    const token = jwt.sign(
      { id: newIntern._id, email: newIntern.email, role: 'intern' },
      process.env.JWT_SECRET || 'datayug_internship_management_system_secure_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Intern registered successfully',
      token,
      intern: {
        id: newIntern._id,
        fullName: newIntern.fullName,
        email: newIntern.email,
        phone: newIntern.phone,
        college: newIntern.college,
        department: newIntern.department
      }
    });
  } catch (error) {
    console.error('Intern signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/intern/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const intern = await Intern.findOne({ email: email.toLowerCase() });
    if (!intern) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, intern.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create Token
    const token = jwt.sign(
      { 
        id: intern._id, 
        email: intern.email, 
        phone: intern.phone, 
        department: intern.department, 
        college: intern.college, 
        fullName: intern.fullName,
        role: 'intern' 
      },
      process.env.JWT_SECRET || 'datayug_internship_management_system_secure_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      intern: {
        id: intern._id,
        fullName: intern.fullName,
        email: intern.email,
        phone: intern.phone,
        college: intern.college,
        department: intern.department
      }
    });
  } catch (error) {
    console.error('Intern login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/intern/profile - Get profile of the logged-in intern
router.get('/profile', auth('intern'), async (req, res) => {
  try {
    const intern = await Intern.findById(req.user.id).select('-password');
    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }
    res.json(intern);
  } catch (error) {
    console.error('Fetch intern profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// GET /api/intern/tasks - Get all tasks assigned to the logged-in intern
router.get('/tasks', auth('intern'), async (req, res) => {
  try {
    const tasks = await Task.find({ intern: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch intern tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// GET /api/intern/stats - Get tasks stats for the logged-in intern
router.get('/stats', auth('intern'), async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ intern: req.user.id });
    const completedTasks = await Task.countDocuments({ intern: req.user.id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ intern: req.user.id, status: 'Pending' });

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks
    });
  } catch (error) {
    console.error('Fetch intern stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// PUT /api/intern/tasks/:id/progress - Update task status
router.put('/tasks/:id/progress', auth('intern'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findOne({ _id: req.params.id, intern: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    task.status = status;
    await task.save();

    res.json({ message: 'Task progress updated successfully', task });
  } catch (error) {
    console.error('Update task progress error:', error);
    res.status(500).json({ message: 'Server error updating task progress' });
  }
});

// Helper to process intern task submission (attachments and notes are optional)
async function processInternSubmission(req, res) {
  try {
    const { notes, markCompleted } = req.body || {};
    const task = await Task.findOne({ _id: req.params.id, intern: req.user.id });
    if (!task) {
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    task.images = task.images || [];
    task.documents = task.documents || [];

    if (notes && typeof notes === 'string' && notes.trim()) {
      task.submissionNote = notes.trim();
    }

    if (markCompleted === 'true' || markCompleted === true) {
      task.status = 'Completed';
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileCat = getFileTypeCategory(file.originalname);
        const docObj = {
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`,
          fileType: fileCat,
          fileSize: file.size,
          uploadedBy: 'intern',
          uploadedAt: new Date()
        };
        task.documents.push(docObj);

        if (fileCat === 'image') {
          task.images.push({
            filename: file.filename,
            path: `/uploads/${file.filename}`,
            uploadedAt: new Date()
          });
        }
      });
    }

    await task.save();

    const hasFiles = req.files && req.files.length > 0;
    const msg = hasFiles 
      ? 'Work submitted successfully with file attachments!' 
      : 'Work and deliverables submitted successfully!';

    res.json({
      message: msg,
      task,
      images: task.images,
      documents: task.documents,
      submissionNote: task.submissionNote
    });
  } catch (error) {
    console.error('Save uploaded files error:', error);
    res.status(500).json({ message: error.message || 'Server error saving deliverables' });
  }
}

// POST /api/intern/tasks/:id/upload - Intern submits work (files and notes are completely optional)
router.post('/tasks/:id/upload', auth('intern'), (req, res) => {
  const isMultipart = req.is('multipart/form-data') || (req.headers['content-type'] && req.headers['content-type'].includes('multipart'));
  if (isMultipart) {
    documentUpload.any()(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        console.error('General upload error:', err);
        return res.status(400).json({ message: err.message });
      }
      processInternSubmission(req, res);
    });
  } else {
    processInternSubmission(req, res);
  }
});

// =========================================================
// SHARED DOCUMENTS & MEDIA ROUTES (STUDENT <-> ADMIN EXCHANGE)
// =========================================================

// POST /api/intern/documents - Student sends a document/media to Admin
router.post('/documents', auth('intern'), (req, res) => {
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

      const intern = await Intern.findById(req.user.id);
      const title = req.body.title || req.file.originalname;

      const newDoc = new Document({
        intern: req.user.id,
        sender: 'intern',
        senderName: intern ? intern.fullName : 'Student',
        title: title,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: getFileTypeCategory(req.file.originalname),
        fileSize: req.file.size
      });

      await newDoc.save();

      res.status(201).json({
        message: 'Document shared with Admin successfully!',
        document: newDoc
      });
    } catch (error) {
      console.error('Intern document upload error:', error);
      res.status(500).json({ message: 'Server error uploading document' });
    }
  });
});

// GET /api/intern/documents - Student gets all documents shared between Admin & Student
router.get('/documents', auth('intern'), async (req, res) => {
  try {
    const docs = await Document.find({ intern: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Fetch intern documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

module.exports = router;
