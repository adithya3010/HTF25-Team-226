const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pdf', pdfSchema);
