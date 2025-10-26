const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    username: String,
    text: String,
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: false  // Not required for private messages
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    originalText: String, // Store original text when edited
    userColor: {
        type: String,
        default: '#4B5563'
    },
    // Private message fields
    type: {
        type: String,
        enum: ['room', 'private'],
        default: 'room'
    },
    toUsername: {
        type: String,
        required: false  // Only required for private messages
    }
});

module.exports = mongoose.model('Message', messageSchema);
