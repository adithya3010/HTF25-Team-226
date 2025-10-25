const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Handle user authentication and role management
router.post('/auth', async (req, res) => {
  try {
    const { email, googleId, name, picture, username } = req.body;

    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // For demo purposes, make the first user a moderator
      const isFirstUser = (await User.countDocuments({})) === 0;
      
      user = new User({
        googleId,
        email,
        name,
        picture,
        username,
        isModerator: isFirstUser,
        roles: isFirstUser ? ['user', 'moderator'] : ['user']
      });
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data with roles
    res.json({
      id: user._id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      username: user.username,
      isModerator: user.isModerator,
      roles: user.roles
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get all moderators
router.get('/moderators', async (req, res) => {
  try {
    const moderators = await User.find({ isModerator: true })
      .select('username name picture');
    res.json(moderators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moderators' });
  }
});

// Make a user moderator (admin only)
router.post('/make-moderator/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isModerator = true;
    if (!user.roles.includes('moderator')) {
      user.roles.push('moderator');
    }
    
    await user.save();
    res.json({ message: 'User is now a moderator', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Remove moderator status (admin only)
router.post('/remove-moderator/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isModerator = false;
    user.roles = user.roles.filter(role => role !== 'moderator');
    
    await user.save();
    res.json({ message: 'Moderator status removed', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;