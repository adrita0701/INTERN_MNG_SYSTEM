// Multer storage that saves to local disk normally, or to a private Supabase Storage
// bucket when Supabase is configured (Render's disk is wiped on every restart/deploy).
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BUCKET, isSupabaseEnabled, getSupabase } = require('./supabaseClient');

function uniqueFilename(originalname) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + path.extname(originalname);
}

function supabaseStorage() {
  return {
    _handleFile(req, file, cb) {
      const chunks = [];
      file.stream.on('data', chunk => chunks.push(chunk));
      file.stream.on('error', cb);
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const filename = uniqueFilename(file.originalname);
          const { error } = await getSupabase().storage.from(BUCKET).upload(filename, buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: false
          });
          if (error) return cb(new Error(`File upload failed: ${error.message}`));
          // `path` points nowhere on disk, so the routes' fs.existsSync cleanup is a no-op
          cb(null, { filename, size: buffer.length, path: `supabase://${BUCKET}/${filename}` });
        } catch (err) {
          cb(err);
        }
      });
    },
    _removeFile(req, file, cb) {
      getSupabase().storage.from(BUCKET).remove([file.filename]).then(() => cb(null), cb);
    }
  };
}

function createStorage(uploadDir) {
  if (isSupabaseEnabled()) return supabaseStorage();
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname))
  });
}

// Remove a stored file (disk or bucket). Never throws.
async function removeStoredFile(uploadDir, filename) {
  if (!filename) return;
  try {
    const filePath = path.join(uploadDir, path.basename(filename));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (isSupabaseEnabled()) {
      await getSupabase().storage.from(BUCKET).remove([path.basename(filename)]);
    }
  } catch (e) {
    console.warn('Could not delete stored file:', e.message);
  }
}

// Express handler: serve /uploads/:filename from the private bucket via a short-lived signed URL.
async function serveFromBucket(req, res, next) {
  if (!isSupabaseEnabled()) return next();
  try {
    const filename = path.basename(req.params.filename);
    const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(filename, 60 * 60);
    if (error || !data) return res.status(404).json({ message: 'File not found' });
    res.redirect(302, data.signedUrl);
  } catch (err) {
    next(err);
  }
}

module.exports = { createStorage, removeStoredFile, serveFromBucket };
