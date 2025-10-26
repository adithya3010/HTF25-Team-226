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
    }
});

module.exports = mongoose.model('Message', messageSchema);
