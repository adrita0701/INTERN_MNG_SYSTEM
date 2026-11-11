// One-time copy of backend/data.json (and files in backend/uploads) into Supabase.
// Usage (from backend/):  npm run migrate:supabase
// Safe to re-run: rows are upserted by id, existing files are skipped.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { isSupabaseEnabled, getSupabase, initSupabase, BUCKET } = require('./supabaseClient');
const { SupaAdmin, SupaIntern, SupaTask, SupaDocument } = require('./supabaseStore');

async function main() {
  if (!isSupabaseEnabled()) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env');
  }
  await initSupabase();

  const dataPath = path.join(__dirname, '../data.json');
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : {};
  const admins = data.admins || [];
  const interns = data.interns || [];
  const internIds = new Set(interns.map(i => String(i._id)));
  const tasks = (data.tasks || []).filter(t => internIds.has(String(t.intern)));
  const documents = (data.documents || []).filter(d => internIds.has(String(d.intern)));
  const skippedTasks = (data.tasks || []).length - tasks.length;
  const skippedDocs = (data.documents || []).length - documents.length;

  // Parents before children (foreign keys)
  for (const a of admins) await new SupaAdmin(a).save();
  for (const i of interns) await new SupaIntern(i).save();
  for (const t of tasks) await new SupaTask(t).save();
  for (const d of documents) await new SupaDocument(d).save();

  console.log(`Admins:    ${admins.length}`);
  console.log(`Interns:   ${interns.length}`);
  console.log(`Tasks:     ${tasks.length}${skippedTasks ? ` (skipped ${skippedTasks} belonging to deleted interns)` : ''}`);
  console.log(`Documents: ${documents.length}${skippedDocs ? ` (skipped ${skippedDocs} belonging to deleted interns)` : ''}`);

  // Upload existing files
  const uploadsDir = path.join(__dirname, '../uploads');
  const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile()) : [];
  let uploaded = 0, skipped = 0;
  for (const f of files) {
    const { error } = await getSupabase().storage.from(BUCKET).upload(f, fs.readFileSync(path.join(uploadsDir, f)), { upsert: false });
    if (!error) uploaded++;
    else if (/exists|duplicate/i.test(error.message)) skipped++;
    else console.warn(`  ! ${f}: ${error.message}`);
  }
  console.log(`Files:     ${uploaded} uploaded, ${skipped} already there (of ${files.length})`);
  console.log('✅ Migration complete.');
}

main().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
