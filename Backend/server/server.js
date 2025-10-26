// Load environment variables from the Backend/.env file so this script works
// whether started from project root or Backend folder.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const MessageModel = require('./models/Message');
const PdfModel = require('./models/Pdf');
const VideoModel = require('./models/Video');
const RoomModel = require('./models/Room');
const multer = require('multer');

// Accept file uploads in memory (we'll store buffers in MongoDB)
const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { 
        fileSize: 50 * 1024 * 1024 // Increased to 50MB to handle video files
    } 
});

const app = express();

// Simple CORS for API endpoints (frontend runs on different port)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Mount routes
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const roomsRouter = require('./routes/rooms');
app.use('/api/rooms', roomsRouter);

const server = http.createServer(app);

// Use Socket.IO v4 Server
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Simple in-memory storage as fallback
const messages = new Map(); // roomId -> [{ id, username, content, timestamp, userColor, isPinned }]
const users = new Map(); // socketId -> { username, isMuted, isModerator, color, roomId }
const rooms = new Map(); // roomId -> { name, createdBy }

// Optional MongoDB persistence if configured
const useMongo = !!process.env.MONGODB_URI;
if (useMongo) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected'))
        .catch((err) => console.error('❌ MongoDB error:', err));
}

if (useMongo) {
    mongoose.set('bufferCommands', false); // Disable buffering
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected');
        console.log('💡 TIP: If you cannot connect, make sure to whitelist your IP address in MongoDB Atlas:');
        console.log('1. Go to https://cloud.mongodb.com');
        console.log('2. Click on Network Access');
        console.log('3. Click Add IP Address');
        console.log('4. Add your current IP or select Allow Access from Anywhere');
        isMongoConnected = true;
    });
    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        isMongoConnected = false;
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        isMongoConnected = false;
    });

    // Connect to MongoDB
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
        heartbeatFrequencyMS: 2000,      // Check server status more frequently
        socketTimeoutMS: 45000,          // Close sockets after 45 seconds of inactivity
        family: 4,                       // Use IPv4, skip IPv6
    }).catch((err) => {
        console.error('❌ MongoDB initial connection error:', err);
        console.log('💡 Note: The chat will work in memory-only mode until MongoDB connection is established');
    });
} else {
    console.log('MongoDB not configured (MONGODB_URI missing) — running with in-memory message store');
}

// Serve public folder for simple client if present
app.use(express.static(path.join(__dirname, '../public')));

// Room endpoints
app.get('/api/rooms', async (req, res) => {
    try {
        if (useMongo) {
            const rooms = await RoomModel.find().sort({ createdAt: -1 }).lean();
            res.json(rooms);
        } else {
            const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
                _id: id,
                ...room
            }));
            res.json(roomList);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

app.post('/api/rooms', express.json(), async (req, res) => {
    try {
        const { name, createdBy } = req.body;
        if (!name || !createdBy) {
            return res.status(400).json({ error: 'Name and creator are required' });
        }

        // Check for duplicate room name
        if (useMongo) {
            const existingRoom = await RoomModel.findOne({ name }).lean();
            if (existingRoom) {
                return res.status(400).json({ error: 'A room with this name already exists' });
            }
            
            const room = await RoomModel.create({ 
                name, 
                createdBy,
                createdAt: new Date()
            });
            
            // Initialize message array for new room
            messages.set(room._id.toString(), []);
            
            // Notify all clients about the new room
            io.emit('roomCreated', {
                _id: room._id.toString(),
                name: room.name,
                createdBy: room.createdBy,
                createdAt: room.createdAt
            });
            
            res.json(room);
        } else {
            // In-memory fallback
            const existingRoom = Array.from(rooms.values()).find(r => r.name === name);
            if (existingRoom) {
                return res.status(400).json({ error: 'A room with this name already exists' });
            }

            const roomId = makeId();
            const room = { 
                name, 
                createdBy, 
                createdAt: new Date().toISOString() 
            };
            rooms.set(roomId, room);
            messages.set(roomId, []); // Initialize message array for room
            const roomData = { _id: roomId, ...room };
            io.emit('roomCreated', roomData);
            res.json(roomData);
        }
    } catch (error) {
        console.error('Failed to create room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function broadcastUsers(roomId) {
    const roomUsers = Array.from(users.values())
        .filter(u => u.roomId === roomId)
        .map((u) => ({
            username: u.username,
            isMuted: !!u.isMuted,
            isModerator: !!u.isModerator,
            isOnline: u.isOnline !== false, // Consider users online unless explicitly set to false
            color: u.color,
            lastSeen: u.lastSeen // Include last seen timestamp for offline users
        }));
    io.to(roomId).emit('users', roomUsers);
}

io.on('connection', async (socket) => {
    const username = socket.handshake.query?.username || `User-${socket.id.slice(0,6)}`;
    const roomId = socket.handshake.query?.roomId;
    
    // Check if user already exists (could be offline) and update their status
    const existingUserEntry = Array.from(users.entries()).find(([_, user]) => user.username === username);
    const color = existingUserEntry 
        ? existingUserEntry[1].color 
        : ['#4B5563', '#2F4F4F', '#6B7280', '#3B82F6'][Math.floor(Math.random()*4)];
    
    if (existingUserEntry) {
        // Update existing user with new socket id and online status
        const [oldSocketId, existingUser] = existingUserEntry;
        users.delete(oldSocketId);
        users.set(socket.id, { 
            ...existingUser,
            roomId,
            isOnline: true,
            lastSeen: new Date().toISOString()
        });
    } else {
        // Create new user
        users.set(socket.id, { 
            username, 
            isMuted: false, 
            isModerator: false, 
            color, 
            roomId,
            isOnline: true,
            lastSeen: new Date().toISOString()
        });
    }

    // Join the room if specified
    if (roomId) {
        socket.join(roomId);
    }

    // Send existing messages for the room (load from DB if available)
    if (roomId) {
        if (useMongo) {
            try {
                // Validate roomId is a valid ObjectId
                if (!mongoose.Types.ObjectId.isValid(roomId)) {
                    console.error('Invalid roomId:', roomId);
                    socket.emit('message history', []);
                    return;
                }

                const docs = await MessageModel.find({ roomId: new mongoose.Types.ObjectId(roomId) })
                    .sort({ timestamp: 1 })
                    .lean() // Convert to plain JavaScript objects
                    .limit(200);
                
                console.log('Raw messages from DB:', docs);  // Debug log
                
                const mapped = docs.map((d) => {
                    // Get message ID, with fallbacks
                    let messageId;
                    try {
                        messageId = d.messageId || (d._id && d._id.toString()) || d.id;
                        if (!messageId) {
                            console.error('Message missing ID:', d);
                            messageId = new mongoose.Types.ObjectId().toString(); // Generate new ID as last resort
                        }
                    } catch (err) {
                        console.error('Error getting message ID:', err);
                        messageId = new mongoose.Types.ObjectId().toString();
                    }

                    const userColor = ['#4B5563', '#2F4F4F', '#6B7280', '#3B82F6'][Math.floor(Math.random()*4)];
                    return {
                        id: messageId,
                        username: d.username || 'Unknown User',
                        content: d.text || '',
                        timestamp: d.timestamp || new Date(),
                        userColor: userColor,
                        isPinned: Boolean(d.isPinned),
                        isDeleted: Boolean(d.isDeleted),
                        editedAt: d.editedAt || null,
                        originalText: d.originalText || null
                    };
                });
                socket.emit('message history', mapped);
                // also populate in-memory if not exists
                if (!messages.has(roomId)) {
                    messages.set(roomId, mapped);
                }
            } catch (e) {
                console.error('Failed to load messages from DB', e);
                socket.emit('message history', []);
            }
        } else {
            const roomMessages = messages.get(roomId) || [];
            socket.emit('message history', roomMessages);
        }
    } else {
        socket.emit('message history', []);
    }

    // Notify others in the room
    if (roomId) {
        socket.to(roomId).emit('userJoined', username);
        broadcastUsers(roomId);
    }

    // Handle incoming message from client
    socket.on('message', async (content) => {
        const user = users.get(socket.id) || { username };
        if (!user.roomId) return; // Must be in a room to send messages

        const msg = {
            id: makeId(),
            username: user.username,
            content,
            timestamp: new Date().toISOString(),
            userColor: user.color,
            isPinned: false,
            roomId: user.roomId
        };

        // Add to in-memory store
        const roomMessages = messages.get(user.roomId) || [];
        roomMessages.push(msg);
        messages.set(user.roomId, roomMessages);

        // Persist to Mongo if available and connected
        if (useMongo && isMongoConnected) {
            try {
                // Validate roomId before creating message
                if (!mongoose.Types.ObjectId.isValid(msg.roomId)) {
                    throw new Error('Invalid roomId');
                }
                const savedMessage = await MessageModel.create({
                    messageId: msg.id,
                    username: msg.username,
                    text: msg.content,
                    timestamp: msg.timestamp,
                    roomId: new mongoose.Types.ObjectId(msg.roomId),
                    isPinned: msg.isPinned || false,
                    isDeleted: false,
                    userColor: msg.userColor || '#4B5563'
                });
            } catch (e) {
                console.error('Failed to persist message', e);
            }
        }

        // Emit only to users in the same room
        io.to(user.roomId).emit('message', msg);
    });

    socket.on('deleteMessage', async (messageId) => {
        const user = users.get(socket.id);
        if (!user?.roomId) return;

        const roomMessages = messages.get(user.roomId);
        if (!roomMessages) return;

        const idx = roomMessages.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
            const msg = roomMessages[idx];
            msg.isDeleted = true;
            io.to(user.roomId).emit('messageDeleted', messageId);

            // Update in MongoDB if available
            if (useMongo) {
                try {
                    await MessageModel.findOneAndUpdate(
                        { messageId: messageId },
                        { $set: { isDeleted: true } }
                    );
                } catch (e) {
                    console.error('Failed to update message deleted state:', e);
                }
            }
        }
    });

    socket.on('editMessage', async ({ messageId, newText }) => {
        const user = users.get(socket.id);
        if (!user?.roomId) return;

        const roomMessages = messages.get(user.roomId);
        if (!roomMessages) return;

        const msg = roomMessages.find(m => m.id === messageId);
        if (msg && msg.username === user.username && !msg.isDeleted) { // Only allow editing own messages that aren't deleted
            const originalText = msg.content;
            msg.content = newText;
            msg.editedAt = new Date().toISOString();
            msg.originalText = originalText;

            io.to(user.roomId).emit('messageEdited', {
                messageId,
                newText,
                editedAt: msg.editedAt,
                originalText
            });

            // Update in MongoDB if available
            if (useMongo) {
                try {
                    await MessageModel.findOneAndUpdate(
                        { messageId },
                        { 
                            $set: { 
                                text: newText,
                                editedAt: new Date(),
                                originalText
                            } 
                        }
                    );
                } catch (e) {
                    console.error('Failed to update edited message:', e);
                }
            }
        }
    });

    socket.on('pinMessage', (messageId) => {
        const user = users.get(socket.id);
        if (!user?.roomId) return;

        const roomMessages = messages.get(user.roomId);
        if (!roomMessages) return;

        const msg = roomMessages.find((m) => m.id === messageId);
        if (msg) {
            msg.isPinned = !msg.isPinned;
            io.to(user.roomId).emit('messagePinned', messageId);
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
        if (u && u.roomId) {
            socket.to(u.roomId).emit('userTyping', u.username);
        }
    });

    socket.on('stopTyping', () => {
        const u = users.get(socket.id);
        if (u && u.roomId) {
            socket.to(u.roomId).emit('userStoppedTyping', u.username);
        }
    });

    socket.on('disconnect', () => {
        const u = users.get(socket.id);
        if (u) {
            const { username: leftName, roomId } = u;
            // Update user status to offline with last seen timestamp
            u.isOnline = false;
            u.lastSeen = new Date().toISOString();
            if (roomId) {
                socket.to(roomId).emit('userLeft', {
                    username: leftName,
                    lastSeen: u.lastSeen
                });
                broadcastUsers(roomId);
            }
        }
    });
});


// Upload video endpoint
app.post('/api/upload/video', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { originalname, buffer, mimetype } = req.file;
        
        // Create video document
        const doc = await VideoModel.create({
            filename: originalname,
            data: buffer,
            contentType: mimetype,
            size: buffer.length,
            uploadedBy: req.query.username || 'Anonymous'
        });

        return res.json({
            id: doc._id,
            url: `/api/video/${doc._id}`,
            filename: doc.filename,
            size: doc.size,
            contentType: doc.contentType
        });
    } catch (err) {
        console.error('Video upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve video from DB
app.get('/api/video/:id', async (req, res) => {
    try {
        const doc = await VideoModel.findById(req.params.id).lean().exec();
        if (!doc) return res.status(404).send('Not found');
        
        // Set proper headers for video streaming
        res.setHeader('Content-Type', doc.contentType);
        res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
        res.setHeader('Accept-Ranges', 'bytes');

        // Handle range requests for video streaming
        const range = req.headers.range;
        if (range) {
            const videoBuffer = doc.data.buffer ? Buffer.from(doc.data.buffer) : doc.data;
            const videoSize = videoBuffer.length;
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
            const chunksize = (end - start) + 1;
            const videoChunk = videoBuffer.slice(start, end + 1);

            res.setHeader('Content-Range', `bytes ${start}-${end}/${videoSize}`);
            res.setHeader('Content-Length', chunksize);
            res.status(206);
            return res.send(videoChunk);
        }

        return res.send(doc.data.buffer ? Buffer.from(doc.data.buffer) : doc.data);
    } catch (err) {
        console.error('Serve video error:', err);
        return res.status(500).send('Server error');
    }
});

const pdfParse = require('pdf-parse');

// Upload PDF endpoint - stores PDF as binary Buffer in MongoDB with metadata
app.post('/api/upload/pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { originalname, buffer, mimetype } = req.file;
        
        // Extract PDF metadata
        let pdfData;
        try {
            pdfData = await pdfParse(buffer);
        } catch (parseErr) {
            console.error('PDF parse error:', parseErr);
            pdfData = { numpages: 0, info: {} };
        }

        // Create PDF document with metadata
        const doc = await PdfModel.create({
            filename: originalname,
            data: buffer,
            contentType: mimetype,
            size: buffer.length,
            pages: pdfData.numpages,
            metadata: {
                title: pdfData.info?.Title || originalname,
                author: pdfData.info?.Author || 'Unknown',
                subject: pdfData.info?.Subject || '',
                keywords: pdfData.info?.Keywords ? pdfData.info.Keywords.split(',').map(k => k.trim()) : []
            },
            uploadedBy: req.query.username || 'Anonymous'
        });

        return res.json({
            id: doc._id,
            url: `/api/pdf/${doc._id}`,
            filename: doc.filename,
            pages: doc.pages,
            size: doc.size,
            metadata: doc.metadata
        });
    } catch (err) {
        console.error('Upload error', err);
        return res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve PDF from DB
app.get('/api/pdf/:id', async (req, res) => {
    try {
        const doc = await PdfModel.findById(req.params.id).lean().exec();
        if (!doc) return res.status(404).send('Not found');
        res.setHeader('Content-Type', doc.contentType || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${doc.filename || 'file.pdf'}"`);
        return res.send(doc.data.buffer ? Buffer.from(doc.data.buffer) : doc.data);
    } catch (err) {
        console.error('Serve PDF error', err);
        return res.status(500).send('Server error');
    }
});

// Start server on port 3001 to match frontend
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Socket server running at http://localhost:${PORT}`);
});
