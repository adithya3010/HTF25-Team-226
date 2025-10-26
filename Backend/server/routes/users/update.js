const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// Update user profile
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, name } = req.body;

    // Find user and update
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check username uniqueness if updating username
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }
    
    if (name) user.name = name;

    await user.save();
    res.json({
      username: user.username,
      name: user.name,
      email: user.email,
      picture: user.picture
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});