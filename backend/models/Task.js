const mongoose = require('mongoose');
const { LocalTask } = require('../database/localStore');

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

function Task(data) {
  if (isLocalDB()) {
    return new LocalTask(data);
  }
  return new MongooseTask(data);
}

Task.countDocuments = function(...args) {
  if (isLocalDB()) return LocalTask.countDocuments(...args);
  return MongooseTask.countDocuments(...args);
};

Task.find = function(...args) {
  if (isLocalDB()) return LocalTask.find(...args);
  return MongooseTask.find(...args);
};

Task.findById = function(...args) {
  if (isLocalDB()) return LocalTask.findById(...args);
  return MongooseTask.findById(...args);
};

Task.findOne = function(...args) {
  if (isLocalDB()) return LocalTask.findOne(...args);
  return MongooseTask.findOne(...args);
};

Task.deleteMany = function(...args) {
  if (isLocalDB()) return LocalTask.deleteMany(...args);
  return MongooseTask.deleteMany(...args);
};

module.exports = Task;
