const mongoose = require('mongoose');
const { LocalTask } = require('../database/localStore');
const { SupaTask } = require('../database/supabaseStore');
const { isSupabaseEnabled } = require('../database/supabaseClient');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'document'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: String,
    enum: ['admin', 'intern'],
    default: 'intern'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: true
  },
  images: [imageSchema],
  documents: [documentSchema],
  submissionNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const MongooseTask = mongoose.models.Task || mongoose.model('Task', taskSchema);
const isLocalDB = () => global.USE_LOCAL_DB || !mongoose.connection || mongoose.connection.readyState !== 1;

// Pick the active backend: Supabase > MongoDB > local JSON file
const impl = () => (isSupabaseEnabled() ? SupaTask : isLocalDB() ? LocalTask : MongooseTask);

function Task(data) {
  const Impl = impl();
  return new Impl(data);
}

Task.countDocuments = (...args) => impl().countDocuments(...args);
Task.find = (...args) => impl().find(...args);
Task.findById = (...args) => impl().findById(...args);
Task.findOne = (...args) => impl().findOne(...args);
Task.deleteMany = (...args) => impl().deleteMany(...args);

module.exports = Task;
