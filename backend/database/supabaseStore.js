// Supabase (Postgres) implementation of the Admin / Intern / Task / Document models.
// Exposes the same Mongoose-style API the routes already use (find, findOne, findById,
// countDocuments, findByIdAndDelete, deleteMany, .select(), .sort(), .save(), .toObject()).
const crypto = require('crypto');
const { getSupabase } = require('./supabaseClient');

// 24-char hex id, same shape as MongoDB ObjectId / the local JSON store
const generateId = () => crypto.randomBytes(12).toString('hex');

const COMMON_FIELDS = { _id: 'id', createdAt: 'created_at', updatedAt: 'updated_at' };

const SCHEMAS = {
  admins: {
    fields: { email: 'email', password: 'password' },
    defaults: () => ({ email: '', password: '' })
  },
  interns: {
    fields: {
      fullName: 'full_name', email: 'email', phone: 'phone',
      college: 'college', department: 'department', password: 'password'
    },
    defaults: () => ({ fullName: '', email: '', phone: '', college: '', department: '', password: '' })
  },
  tasks: {
    fields: {
      title: 'title', description: 'description', deadline: 'deadline', status: 'status',
      intern: 'intern_id', images: 'images', documents: 'documents', submissionNote: 'submission_note'
    },
    defaults: () => ({
      title: '', description: '', deadline: new Date().toISOString(), status: 'Pending',
      intern: null, images: [], documents: [], submissionNote: ''
    })
  },
  documents: {
    fields: {
      intern: 'intern_id', sender: 'sender', senderName: 'sender_name', title: 'title',
      filename: 'filename', originalName: 'original_name', fileUrl: 'file_url',
      fileType: 'file_type', fileSize: 'file_size'
    },
    defaults: () => ({
      intern: null, sender: 'intern', senderName: '', title: '', filename: '',
      originalName: '', fileUrl: '', fileType: 'other', fileSize: 0
    })
  }
};

function columnMap(table) {
  return { ...COMMON_FIELDS, ...SCHEMAS[table].fields };
}

function toRow(table, obj) {
  const row = {};
  for (const [prop, col] of Object.entries(columnMap(table))) {
    if (obj[prop] !== undefined) {
      row[col] = (prop === '_id' || prop === 'intern') && obj[prop] != null ? String(obj[prop]) : obj[prop];
    }
  }
  return row;
}

function applyFilter(table, builder, query = {}) {
  const map = columnMap(table);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined) continue;
    const col = map[key];
    if (!col) throw new Error(`Unsupported filter field "${key}" on ${table}`);
    const v = key === 'email' ? String(value).toLowerCase() : String(value);
    builder = builder.eq(col, v);
  }
  return builder;
}

function check(error) {
  if (error) throw new Error(`Supabase error: ${error.message}`);
}

function createModel(table) {
  const map = columnMap(table);

  class Model {
    constructor(data = {}) {
      Object.assign(this, SCHEMAS[table].defaults(), data);
      if (!this._id) this._id = generateId();
      if (typeof this.email === 'string') this.email = this.email.toLowerCase();
      const now = new Date().toISOString();
      this.createdAt = this.createdAt || now;
      this.updatedAt = this.updatedAt || now;
    }

    toObject() {
      return { ...this };
    }

    async save() {
      this.updatedAt = new Date().toISOString();
      const { error } = await getSupabase().from(table).upsert(toRow(table, this));
      check(error);
      return this;
    }

    static fromRow(row) {
      if (!row) return null;
      const doc = Object.create(Model.prototype);
      for (const [prop, col] of Object.entries(map)) {
        if (row[col] !== undefined) doc[prop] = row[col];
      }
      return doc;
    }

    static find(query = {}) {
      return new QueryChain(Model, table, query, false);
    }

    static findOne(query = {}) {
      return new QueryChain(Model, table, query, true);
    }

    static findById(id) {
      if (id == null) return new QueryChain(Model, table, null, true);
      return new QueryChain(Model, table, { _id: id }, true);
    }

    static async countDocuments(query = {}) {
      let builder = getSupabase().from(table).select('id', { count: 'exact', head: true });
      builder = applyFilter(table, builder, query);
      const { count, error } = await builder;
      check(error);
      return count || 0;
    }

    static async findByIdAndDelete(id) {
      const { data, error } = await getSupabase().from(table).delete().eq('id', String(id)).select();
      check(error);
      return data && data[0] ? Model.fromRow(data[0]) : null;
    }

    static async deleteMany(query = {}) {
      if (!query || Object.keys(query).length === 0) {
        throw new Error(`Refusing to delete every row in ${table} without a filter`);
      }
      let builder = getSupabase().from(table).delete();
      builder = applyFilter(table, builder, query);
      const { error } = await builder;
      check(error);
      return { acknowledged: true };
    }
  }

  return Model;
}

// Lazy, thenable query supporting .select('-password') and .sort({ field: 1 | -1 })
class QueryChain {
  constructor(Model, table, query, single) {
    this.Model = Model;
    this.table = table;
    this.query = query;
    this.single = single;
    this.hidePassword = false;
    this.sortBy = null;
  }

  select(fields) {
    if (typeof fields === 'string' && fields.split(/\s+/).includes('-password')) {
      this.hidePassword = true;
    }
    return this;
  }

  sort(sortObj) {
    const key = sortObj && Object.keys(sortObj)[0];
    if (key) this.sortBy = { key, ascending: sortObj[key] === 1 || sortObj[key] === 'asc' };
    return this;
  }

  async exec() {
    if (this.query === null) return this.single ? null : [];

    let builder = getSupabase().from(this.table).select('*');
    builder = applyFilter(this.table, builder, this.query);

    if (this.sortBy) {
      const col = columnMap(this.table)[this.sortBy.key] || this.sortBy.key;
      builder = builder.order(col, { ascending: this.sortBy.ascending });
    } else {
      builder = builder.order('created_at', { ascending: true });
    }
    if (this.single) builder = builder.limit(1);

    const { data, error } = await builder;
    check(error);

    const docs = (data || []).map(row => {
      const doc = this.Model.fromRow(row);
      if (this.hidePassword) delete doc.password;
      return doc;
    });
    return this.single ? docs[0] || null : docs;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

module.exports = {
  SupaAdmin: createModel('admins'),
  SupaIntern: createModel('interns'),
  SupaTask: createModel('tasks'),
  SupaDocument: createModel('documents'),
  generateId
};
