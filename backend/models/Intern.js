const mongoose = require('mongoose');
const { LocalIntern } = require('../database/localStore');

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

function Intern(data) {
  if (isLocalDB()) {
    return new LocalIntern(data);
  }
  return new MongooseIntern(data);
}

Intern.countDocuments = function(...args) {
  if (isLocalDB()) return LocalIntern.countDocuments(...args);
  return MongooseIntern.countDocuments(...args);
};

Intern.find = function(...args) {
  if (isLocalDB()) return LocalIntern.find(...args);
  return MongooseIntern.find(...args);
};

Intern.findById = function(...args) {
  if (isLocalDB()) return LocalIntern.findById(...args);
  return MongooseIntern.findById(...args);
};

Intern.findOne = function(...args) {
  if (isLocalDB()) return LocalIntern.findOne(...args);
  return MongooseIntern.findOne(...args);
};

Intern.findByIdAndDelete = function(...args) {
  if (isLocalDB()) return LocalIntern.findByIdAndDelete(...args);
  return MongooseIntern.findByIdAndDelete(...args);
};

module.exports = Intern;
