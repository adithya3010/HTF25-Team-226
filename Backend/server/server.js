// Load environment variables from the Backend/.env file so this script works
// whether started from project root or Backend folder.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const MessageModel = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Use Socket.IO v4 Server
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Simple in-memory storage as fallback
const messages = []; // { id, username, content, timestamp, userColor, isPinned }
const users = new Map(); // socketId -> { username, isMuted, isModerator, color }

// Optional MongoDB persistence if configured
const useMongo = !!process.env.MONGODB_URI;
if (useMongo) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log('✅ MongoDB connected'))
        .catch((err) => console.error('❌ MongoDB error:', err));
}

if (useMongo) {
    mongoose.connection.on('connected', () => console.log('MongoDB connection state: connected'));
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
} else {
    console.log('MongoDB not configured (MONGODB_URI missing) — running with in-memory message store');
}

// Serve public folder for simple client if present
app.use(express.static(path.join(__dirname, '../public')));

function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function broadcastUsers() {
    const list = Array.from(users.values()).map((u) => ({
        username: u.username,
        isMuted: !!u.isMuted,
        isModerator: !!u.isModerator,
    }));
    io.emit('users', list);
}

io.on('connection', async (socket) => {
    const username = socket.handshake.query?.username || `User-${socket.id.slice(0,6)}`;
    // Assign color for avatar
    const color = ['#4B5563', '#2F4F4F', '#6B7280', '#3B82F6'][Math.floor(Math.random()*4)];
    users.set(socket.id, { username, isMuted: false, isModerator: false, color });

    // Send existing messages (load from DB if available)
    if (useMongo) {
        try {
            const docs = await MessageModel.find().sort({ timestamp: 1 }).limit(200);
            const mapped = docs.map((d) => ({
                id: d._id.toString(),
                username: d.username,
                content: d.text,
                timestamp: d.timestamp,
                userColor: color,
                isPinned: !!d.isPinned,
            }));
            socket.emit('message history', mapped);
            // also populate in-memory
            messages.push(...mapped);
        } catch (e) {
            console.error('Failed to load messages from DB', e);
        }
    } else {
        socket.emit('message history', messages);
    }

    // Notify others
    socket.broadcast.emit('userJoined', username);
    broadcastUsers();

    // Handle incoming message from client
    socket.on('message', async (content) => {
        const user = users.get(socket.id) || { username };
        const msg = {
            id: makeId(),
            username: user.username,
            content,
            timestamp: new Date().toISOString(),
            userColor: user.color,
            isPinned: false,
        };
        messages.push(msg);

        // Persist to Mongo if available
        if (useMongo) {
            try {
                await MessageModel.create({ username: msg.username, text: msg.content, timestamp: msg.timestamp });
            } catch (e) {
                console.error('Failed to persist message', e);
            }
        }

        io.emit('message', msg);
    });

    socket.on('deleteMessage', (messageId) => {
        const idx = messages.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
            messages.splice(idx, 1);
            io.emit('messageDeleted', messageId);
        }
    });

    socket.on('pinMessage', (messageId) => {
        const msg = messages.find((m) => m.id === messageId);
        if (msg) {
            msg.isPinned = !msg.isPinned;
            io.emit('messagePinned', messageId);
        }
    });

    socket.on('muteUser', (targetUsername) => {
        for (const [id, u] of users.entries()) {
            if (u.username === targetUsername) {
                u.isMuted = true;
                io.emit('userMuted', targetUsername);
                break;
            }
        }
        broadcastUsers();
    });

    socket.on('unmuteUser', (targetUsername) => {
        for (const [id, u] of users.entries()) {
            if (u.username === targetUsername) {
                u.isMuted = false;
                io.emit('userUnmuted', targetUsername);
                break;
            }
        }
        broadcastUsers();
    });

    socket.on('typing', () => {
        const u = users.get(socket.id);
        if (u) socket.broadcast.emit('userTyping', u.username);
    });

    socket.on('stopTyping', () => {
        const u = users.get(socket.id);
        if (u) socket.broadcast.emit('userStoppedTyping', u.username);
    });

    socket.on('disconnect', () => {
        const u = users.get(socket.id);
        const leftName = u?.username || 'A user';
        users.delete(socket.id);
        socket.broadcast.emit('userLeft', leftName);
        broadcastUsers();
    });
});

// Start server on port 3001 to match frontend
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Socket server running at http://localhost:${PORT}`);
});
