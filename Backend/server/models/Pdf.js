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
  },
  summary: {
    text: String,
    generatedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }
});

module.exports = mongoose.model('Pdf', pdfSchema);
