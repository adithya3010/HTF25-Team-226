const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    isPinned: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Message', messageSchema);
