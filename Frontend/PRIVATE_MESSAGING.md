# Private Messaging Feature

## Overview
Private messaging allows users to send direct messages to each other within the chatroom application.

## Features
- ✉️ Send private messages to any user (online or offline)
- 🔔 Real-time notifications when receiving private messages
- 💬 Persistent message history
- 🎯 Click on notification to open chat directly
- 📱 Responsive design with floating chat window

## How to Use

### Sending a Private Message
1. Look at the Users sidebar (right side of the screen)
2. Find the user you want to message
3. Click the **message icon** (💬) next to their name
4. A chat window will open at the bottom right
5. Type your message and press Send

### Receiving Messages
- When someone sends you a private message, you'll see:
  - A notification toast at the top right
  - The sender's name and message preview
  - A "Reply" button to quickly respond
  
### Managing Chats
- Click the **X** button to close a private chat window
- Chat history is saved and will load when you reopen a conversation
- You can message both online and offline users

## Technical Implementation

### Backend Events
The backend supports these socket events:
- `privateMessage` - Send a private message
- `getPrivateMessages` - Retrieve message history with a user
- `privateMessageHistory` - Receive message history

### Frontend Components
- **PrivateChat.jsx** - Floating chat window component
- **UserSidebar.jsx** - Updated with message buttons
- **useSocket.js** - Hook with notification support

### Message Format
```javascript
{
  id: string,
  from: string,
  to: string,
  content: string,
  timestamp: ISO date string
}
```

## Customization

### Notification Sound
To add a custom notification sound:
1. Place an audio file named `notification.mp3` in `/public/`
2. The sound will play automatically on new messages

### Styling
The chat window uses Tailwind CSS with a dark theme matching the app's design:
- Indigo gradient background
- Animated borders
- Smooth transitions

## Browser Support
- Requires modern browser with WebSocket support
- Desktop and mobile responsive
- Works with screen readers

## Future Enhancements
- [ ] Unread message counter
- [ ] Typing indicators for private chats
- [ ] Message read receipts
- [ ] File sharing in private messages
- [ ] Search message history
