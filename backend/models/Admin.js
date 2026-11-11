const mongoose = require('mongoose');
const { LocalAdmin } = require('../database/localStore');

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

function Admin(data) {
  if (isLocalDB()) {
    return new LocalAdmin(data);
  }
  return new MongooseAdmin(data);
}

Admin.findOne = function(...args) {
  if (isLocalDB()) {
    return LocalAdmin.findOne(...args);
  }
  return MongooseAdmin.findOne(...args);
};

module.exports = Admin;
