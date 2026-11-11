const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataFilePath = path.join(__dirname, '../data.json');

// Helper to generate a 24-char hex id like MongoDB ObjectId
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Initial DB state
function loadData() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      const initial = { admins: [], interns: [], tasks: [], documents: [] };
      fs.writeFileSync(dataFilePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(content || '{"admins":[],"interns":[],"tasks":[],"documents":[]}');
    if (!parsed.documents) parsed.documents = [];
    return parsed;
  } catch (err) {
    return { admins: [], interns: [], tasks: [], documents: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local data:', err);
  }
}

// Wrap an object with Mongoose-compatible helper methods like .toObject() and .save()
function wrapDoc(collectionName, item) {
  if (!item) return null;
  const doc = { ...item };
  doc._id = doc._id || doc.id;
  doc.toObject = function() {
    const obj = { ...this };
    delete obj.toObject;
    delete obj.save;
    return obj;
  };
  doc.save = async function() {
    const data = loadData();
    const idx = data[collectionName].findIndex(x => x._id === this._id);
    const toSave = { ...this };
    delete toSave.toObject;
    delete toSave.save;
    toSave.updatedAt = new Date().toISOString();
    
    if (idx >= 0) {
      data[collectionName][idx] = toSave;
    } else {
      toSave.createdAt = toSave.createdAt || new Date().toISOString();
      data[collectionName].push(toSave);
    }
    saveData(data);
    return this;
  };
  return doc;
}

// Query helper for chaining .select() and .sort()
class QueryChain {
  constructor(collectionName, promiseOrArray) {
    this.collectionName = collectionName;
    this.source = promiseOrArray;
    this._selectFields = null;
    this._sortField = null;
    this._sortAsc = false;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  sort(sortObj) {
    if (sortObj) {
      const key = Object.keys(sortObj)[0];
      this._sortField = key;
      this._sortAsc = sortObj[key] === 1;
    }
    return this;
  }

  async exec() {
    let list = Array.isArray(this.source) ? this.source : await this.source;
    if (!Array.isArray(list)) {
      if (list && this._selectFields && this._selectFields.includes('-password')) {
        const copy = { ...list };
        delete copy.password;
        return wrapDoc(this.collectionName, copy);
      }
      return wrapDoc(this.collectionName, list);
    }

    let results = list.map(item => wrapDoc(this.collectionName, item));

    if (this._sortField) {
      results.sort((a, b) => {
        const valA = a[this._sortField] || '';
        const valB = b[this._sortField] || '';
        if (valA < valB) return this._sortAsc ? -1 : 1;
        if (valA > valB) return this._sortAsc ? 1 : -1;
        return 0;
      });
    }

    if (this._selectFields && this._selectFields.includes('-password')) {
      results = results.map(item => {
        const c = { ...item };
        delete c.password;
        return wrapDoc(this.collectionName, c);
      });
    }

    return results;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

// Local Admin Model
class LocalAdmin {
  constructor(data = {}) {
    this._id = generateId();
    this.email = data.email || '';
    this.password = data.password || '';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    const data = loadData();
    const doc = {
      _id: this._id,
      email: this.email,
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    data.admins.push(doc);
    saveData(data);
    return wrapDoc('admins', doc);
  }

  static async findOne(query = {}) {
    const data = loadData();
    if (!query || Object.keys(query).length === 0) {
      return wrapDoc('admins', data.admins[0] || null);
    }
    const email = query.email ? query.email.toLowerCase() : null;
    const found = data.admins.find(a => email ? a.email.toLowerCase() === email : true);
    return wrapDoc('admins', found || null);
  }
}

// Local Intern Model
class LocalIntern {
  constructor(data = {}) {
    this._id = generateId();
    this.fullName = data.fullName || '';
    this.email = data.email ? data.email.toLowerCase() : '';
    this.phone = data.phone || '';
    this.college = data.college || '';
    this.department = data.department || '';
    this.password = data.password || '';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    const data = loadData();
    const doc = {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      college: this.college,
      department: this.department,
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    data.interns.push(doc);
    saveData(data);
    return wrapDoc('interns', doc);
  }

  static async countDocuments() {
    const data = loadData();
    return data.interns.length;
  }

  static find() {
    const data = loadData();
    return new QueryChain('interns', [...data.interns]);
  }

  static findById(id) {
    const data = loadData();
    const found = data.interns.find(i => i._id === id || String(i._id) === String(id));
    return new QueryChain('interns', found || null);
  }

  static async findOne(query = {}) {
    const data = loadData();
    if (query.email) {
      const email = query.email.toLowerCase();
      const found = data.interns.find(i => i.email.toLowerCase() === email);
      return wrapDoc('interns', found || null);
    }
    if (query._id) {
      const found = data.interns.find(i => i._id === query._id || String(i._id) === String(query._id));
      return wrapDoc('interns', found || null);
    }
    return wrapDoc('interns', data.interns[0] || null);
  }

  static async findByIdAndDelete(id) {
    const data = loadData();
    const before = data.interns.length;
    data.interns = data.interns.filter(i => i._id !== id && String(i._id) !== String(id));
    saveData(data);
    return before !== data.interns.length;
  }
}

// Local Task Model
class LocalTask {
  constructor(data = {}) {
    this._id = data._id || generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.deadline = data.deadline || new Date().toISOString();
    this.status = data.status || 'Pending';
    this.intern = data.intern || null;
    this.images = data.images || [];
    this.documents = data.documents || [];
    this.submissionNote = data.submissionNote || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  async save() {
    const data = loadData();
    const doc = {
      _id: this._id,
      title: this.title,
      description: this.description,
      deadline: this.deadline,
      status: this.status,
      intern: this.intern,
      images: this.images,
      documents: this.documents,
      submissionNote: this.submissionNote,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString()
    };
    const idx = data.tasks.findIndex(t => t._id === this._id);
    if (idx >= 0) {
      data.tasks[idx] = doc;
    } else {
      data.tasks.push(doc);
    }
    saveData(data);
    return wrapDoc('tasks', doc);
  }

  static async countDocuments(query = {}) {
    const data = loadData();
    let list = data.tasks;
    if (query.status) {
      list = list.filter(t => t.status === query.status);
    }
    if (query.intern) {
      list = list.filter(t => String(t.intern) === String(query.intern));
    }
    return list.length;
  }

  static find(query = {}) {
    const data = loadData();
    let list = [...data.tasks];
    if (query.intern) {
      list = list.filter(t => String(t.intern) === String(query.intern));
    }
    return new QueryChain('tasks', list);
  }

  static async findById(id) {
    const data = loadData();
    const found = data.tasks.find(t => String(t._id) === String(id));
    return wrapDoc('tasks', found || null);
  }

  static async findOne(query = {}) {
    const data = loadData();
    let found = null;
    if (query._id && query.intern) {
      found = data.tasks.find(t => String(t._id) === String(query._id) && String(t.intern) === String(query.intern));
    } else if (query._id) {
      found = data.tasks.find(t => String(t._id) === String(query._id));
    }
    return wrapDoc('tasks', found || null);
  }

  static async deleteMany(query = {}) {
    const data = loadData();
    if (query.intern) {
      data.tasks = data.tasks.filter(t => String(t.intern) !== String(query.intern));
      saveData(data);
    }
    return { acknowledged: true };
  }
}

// Local Document Model (File Sharing between Admin and Intern)
class LocalDocument {
  constructor(data = {}) {
    this._id = generateId();
    this.intern = data.intern || null;
    this.sender = data.sender || 'intern'; // 'admin' | 'intern'
    this.senderName = data.senderName || '';
    this.title = data.title || '';
    this.filename = data.filename || '';
    this.originalName = data.originalName || '';
    this.fileUrl = data.fileUrl || '';
    this.fileType = data.fileType || 'other';
    this.fileSize = data.fileSize || 0;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    const data = loadData();
    data.documents = data.documents || [];
    const doc = {
      _id: this._id,
      intern: this.intern,
      sender: this.sender,
      senderName: this.senderName,
      title: this.title,
      filename: this.filename,
      originalName: this.originalName,
      fileUrl: this.fileUrl,
      fileType: this.fileType,
      fileSize: this.fileSize,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    const idx = data.documents.findIndex(d => d._id === this._id);
    if (idx >= 0) {
      data.documents[idx] = doc;
    } else {
      data.documents.push(doc);
    }
    saveData(data);
    return wrapDoc('documents', doc);
  }

  static find(query = {}) {
    const data = loadData();
    data.documents = data.documents || [];
    let list = [...data.documents];
    if (query.intern) {
      list = list.filter(d => String(d.intern) === String(query.intern));
    }
    return new QueryChain('documents', list);
  }

  static async findById(id) {
    const data = loadData();
    data.documents = data.documents || [];
    const found = data.documents.find(d => d._id === id || String(d._id) === String(id));
    return wrapDoc('documents', found || null);
  }

  static async findByIdAndDelete(id) {
    const data = loadData();
    data.documents = data.documents || [];
    const before = data.documents.length;
    data.documents = data.documents.filter(d => d._id !== id && String(d._id) !== String(id));
    saveData(data);
    return before !== data.documents.length;
  }

  static async deleteMany(query = {}) {
    const data = loadData();
    data.documents = data.documents || [];
    if (query.intern) {
      data.documents = data.documents.filter(d => String(d.intern) !== String(query.intern));
      saveData(data);
    }
    return { acknowledged: true };
  }
}

module.exports = {
  LocalAdmin,
  LocalIntern,
  LocalTask,
  LocalDocument
};
