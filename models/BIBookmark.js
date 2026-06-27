const mongoose = require('mongoose');
const { Schema } = mongoose;

const biBookmarkSchema = new Schema({
  bookmarkCode: { type: String, unique: true },
  user:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true, trim: true },
  path:         { type: String, required: true },
  icon:         String,
  filters:      Schema.Types.Mixed,
  isDefault:    { type: Boolean, default: false },
}, { timestamps: true });

biBookmarkSchema.index({ user: 1 });

biBookmarkSchema.pre('validate', async function (next) {
  if (!this.bookmarkCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('BIBookmark').countDocuments({ bookmarkCode: new RegExp(`^BIB-${y}-`) });
    this.bookmarkCode = `BIB-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BIBookmark', biBookmarkSchema);
