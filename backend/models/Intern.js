const mongoose = require('mongoose');
const { LocalIntern } = require('../database/localStore');
const { SupaIntern } = require('../database/supabaseStore');
const { isSupabaseEnabled } = require('../database/supabaseClient');

const internSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

const MongooseIntern = mongoose.models.Intern || mongoose.model('Intern', internSchema);
const isLocalDB = () => global.USE_LOCAL_DB || !mongoose.connection || mongoose.connection.readyState !== 1;

// Pick the active backend: Supabase > MongoDB > local JSON file
const impl = () => (isSupabaseEnabled() ? SupaIntern : isLocalDB() ? LocalIntern : MongooseIntern);

function Intern(data) {
  const Impl = impl();
  return new Impl(data);
}

Intern.countDocuments = (...args) => impl().countDocuments(...args);
Intern.find = (...args) => impl().find(...args);
Intern.findById = (...args) => impl().findById(...args);
Intern.findOne = (...args) => impl().findOne(...args);
Intern.findByIdAndDelete = (...args) => impl().findByIdAndDelete(...args);

module.exports = Intern;
