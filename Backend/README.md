# 💬 Real-Time Chat App

A real-time chat room application built using **Node.js**, **Express.js**, **Socket.IO**, and **MongoDB**. Users can join the chat, see who is online, and exchange messages instantly with timestamp support.

---

## 🚀 Features

- 🔌 Real-time messaging with **Socket.IO**
- 🧑‍🤝‍🧑 Online user tracking
- 💬 Message history stored in **MongoDB**
- 🕒 Relative time shown for each message (e.g., "2 minutes ago")
- 💅 Responsive frontend using **HTML/CSS**
- 🌐 Deployed on **Render**

---

## 📁 Project Structure

```
chat-app/
│
├── public/
│   ├── client.js          # Handles Socket.IO on frontend
│   ├── index.html         # UI for chat room
│   └── style.css          # Styling
│
├── server/
│   ├── server.js          # Backend server
│   └── models/
│       └── Message.js     # Mongoose schema for chat messages
│
├── .env                   # Contains MongoDB URI
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.IO
- **Database**: MongoDB with Mongoose
- **Deployment**: Render

---

## 📦 Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/adithya3010/chat-app.git
cd chat-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root:

```env
PORT=3000
MONGO_URL=your_mongodb_connection_string
```

### 4. Run locally
```bash
npm start
```

App will be running at `http://localhost:3000`

---

## 🚀 Deploying to Render

1. Push the repo to GitHub
2. Go to [https://render.com](https://render.com)
3. Click `New Web Service`
4. Connect your GitHub repo
5. Set the **Build Command** to:
```bash
npm install
```
6. Set the **Start Command** to:
```bash
node server/server.js
```
7. Add **Environment Variable**:
   - `MONGO_URL = your_connection_string`

---

## 📸 Screenshots

> ![image](https://github.com/user-attachments/assets/6145798e-9bd6-43a1-b7da-d905d4af88d9)

---

## 🧠 Future Improvements

- Private messaging
- User authentication
- Typing indicators
- Emojis and file sharing

---

## 🧑‍💻 Author

- **Adithya Motapalukula**

---
##TRy it here:
-Click here[https://chat-app-vu7z.onrender.com]
