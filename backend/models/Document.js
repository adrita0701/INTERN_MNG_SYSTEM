const mongoose = require('mongoose');
const { LocalDocument } = require('../database/localStore');

const documentSchema = new mongoose.Schema({
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: true
  },
  sender: {
    type: String,
    enum: ['admin', 'intern'],
    required: true
  },
  senderName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled Document'
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'other'
  },
  fileSize: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const MongooseDocument = mongoose.models.Document || mongoose.model('Document', documentSchema);

const isLocalDB = () => global.USE_LOCAL_DB || !mongoose.connection || mongoose.connection.readyState !== 1;

function Document(data) {
  if (isLocalDB()) {
    return new LocalDocument(data);
  }
  return new MongooseDocument(data);
}

Document.find = function(...args) {
  if (isLocalDB()) return LocalDocument.find(...args);
  return MongooseDocument.find(...args);
};

Document.findById = function(...args) {
  if (isLocalDB()) return LocalDocument.findById(...args);
  return MongooseDocument.findById(...args);
};

Document.findByIdAndDelete = function(...args) {
  if (isLocalDB()) return LocalDocument.findByIdAndDelete(...args);
  return MongooseDocument.findByIdAndDelete(...args);
};

Document.deleteMany = function(...args) {
  if (isLocalDB()) return LocalDocument.deleteMany(...args);
  return MongooseDocument.deleteMany(...args);
};

module.exports = Document;
