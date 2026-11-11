const mongoose = require('mongoose');
const { LocalDocument } = require('../database/localStore');
const { SupaDocument } = require('../database/supabaseStore');
const { isSupabaseEnabled } = require('../database/supabaseClient');

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

// Pick the active backend: Supabase > MongoDB > local JSON file
const impl = () => (isSupabaseEnabled() ? SupaDocument : isLocalDB() ? LocalDocument : MongooseDocument);

function Document(data) {
  const Impl = impl();
  return new Impl(data);
}

Document.find = (...args) => impl().find(...args);
Document.findById = (...args) => impl().findById(...args);
Document.findByIdAndDelete = (...args) => impl().findByIdAndDelete(...args);
Document.deleteMany = (...args) => impl().deleteMany(...args);

module.exports = Document;
