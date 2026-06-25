
// One-off repair: relink team photo paths to where the file actually exists.
// Cause: legacy records stored '/uploads/team/<file>' but files live in '/uploads/<file>'.
require('dotenv').config();
const mongoose = require('mongoose');
const fs   = require('fs');
const path = require('path');

const UPLOADS = path.join(__dirname, 'uploads');

// Search the uploads root + every subdirectory for a given basename.
function findFile(base) {
  const subdirs = fs.readdirSync(UPLOADS).filter(d =>
    fs.statSync(path.join(UPLOADS, d)).isDirectory());
  const dirs = ['', ...subdirs];
  for (const d of dirs) {
    if (fs.existsSync(path.join(UPLOADS, d, base))) {
      return '/uploads/' + (d ? d + '/' : '') + base;
    }
  }
  return null;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const TeamMember = require('./models/TeamMember');
    const docs = await TeamMember.find();
    let fixed = 0;

    for (const d of docs) {
      if (!d.photo) continue;
      if (fs.existsSync(path.join(__dirname, d.photo))) {
        console.log('OK   ', d.name, '->', d.photo);
        continue;
      }
      const corrected = findFile(path.basename(d.photo));
      if (corrected && corrected !== d.photo) {
        console.log('FIX  ', d.name, ':', d.photo, '=>', corrected);
        d.photo = corrected;
        await d.save();
        fixed++;
      } else {
        console.log('MISS ', d.name, ': file not found on disk for', d.photo);
      }
    }
    console.log(`--- repaired ${fixed} record(s) ---`);
    process.exit(0);
  } catch (e) {
    console.error('Repair failed:', e.message);
    process.exit(1);
  }
})();
