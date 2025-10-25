const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  uploadedBy: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  size: Number,
  pages: Number,
  metadata: {
    title: String,
    author: String,
    subject: String,
    keywords: [String]
  }
});

module.exports = mongoose.model('Pdf', pdfSchema);
