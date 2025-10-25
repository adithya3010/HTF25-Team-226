const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  name: String,
  picture: String,
  roles: {
    type: [String],
    default: ['user'],
    enum: ['user', 'moderator', 'admin']
  },
  isModerator: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

module.exports = mongoose.model('User', userSchema);