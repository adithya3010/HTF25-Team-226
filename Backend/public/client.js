const socket = io();
const form = document.getElementById('chat-form');
const input = document.getElementById('msg-input');
const messages = document.getElementById('messages');
const userList = document.getElementById('user-list');

let username = prompt("Enter your name:") || "Anonymous";
socket.emit('new user', username);

// Load message history
socket.on('message history', (msgs) => {
    msgs.forEach(msg => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="meta" title="${new Date(msg.timestamp).toLocaleString()}" datetime="${msg.timestamp}">
                ${timeago.format(msg.timestamp)}
            </span>
            <strong>${msg.username}:</strong> ${msg.text}
        `;
        messages.appendChild(li);
    });
});

// Display chat message
socket.on('chat message', (msg) => {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();

    const li = document.createElement('li');
    li.innerHTML = `
        <span class="meta" title="${new Date(msg.timestamp).toLocaleString()}" datetime="${msg.timestamp}">
            ${timeago.format(msg.timestamp)}
        </span>
        <strong>${msg.username}:</strong> ${msg.text}
    `;
    messages.appendChild(li);
    window.scrollTo(0, document.body.scrollHeight);
});

// Show join/leave notifications
socket.on('user notification', (notice) => {
    const li = document.createElement('li');
    li.textContent = notice;
    li.classList.add('system');
    messages.appendChild(li);
});

// Show online users
socket.on('online users', (users) => {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
});

// Send message
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        socket.emit('chat message', { username, text });
        input.value = '';
        socket.emit('stop typing');
    }
});

// Typing indicator
let typingTimeout;

input.addEventListener('input', () => {
    socket.emit('typing', username);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop typing');
    }, 1500);
});

socket.on('show typing', (name) => {
    if (name !== username) {
        let typingEl = document.getElementById('typing-indicator');
        if (!typingEl) {
            typingEl = document.createElement('li');
            typingEl.id = 'typing-indicator';
            typingEl.classList.add('system');
            typingEl.textContent = `💬 ${name} is typing...`;
            messages.appendChild(typingEl);
        }
    }
});

socket.on('hide typing', () => {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();
});
