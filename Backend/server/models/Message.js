const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
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
