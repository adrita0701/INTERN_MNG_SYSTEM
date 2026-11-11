const mongoose = require('mongoose');
const { LocalAdmin } = require('../database/localStore');
const { SupaAdmin } = require('../database/supabaseStore');
const { isSupabaseEnabled } = require('../database/supabaseClient');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

const MongooseAdmin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const isLocalDB = () => global.USE_LOCAL_DB || !mongoose.connection || mongoose.connection.readyState !== 1;

// Pick the active backend: Supabase > MongoDB > local JSON file
const impl = () => (isSupabaseEnabled() ? SupaAdmin : isLocalDB() ? LocalAdmin : MongooseAdmin);

function Admin(data) {
  const Impl = impl();
  return new Impl(data);
}

Admin.findOne = (...args) => impl().findOne(...args);

module.exports = Admin;
