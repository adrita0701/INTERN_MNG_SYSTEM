const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

let client = null;

// Supabase mode is active whenever both env vars are present.
function isSupabaseEnabled() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function getSupabase() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}

// Verify tables are reachable and make sure the private storage bucket exists.
async function initSupabase() {
  const supabase = getSupabase();

  const { error: tableError } = await supabase.from('admins').select('id').limit(1);
  if (tableError) {
    throw new Error(
      `Cannot read Supabase tables (${tableError.message}). ` +
      'Check SUPABASE_SERVICE_KEY is the secret/service_role key and that backend/database/supabase-schema.sql has been run.'
    );
  }

  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (bucketError && !/already exists/i.test(bucketError.message)) {
      throw new Error(`Cannot create storage bucket "${BUCKET}": ${bucketError.message}`);
    }
  }
}

module.exports = { BUCKET, isSupabaseEnabled, getSupabase, initSupabase };
