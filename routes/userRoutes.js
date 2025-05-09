const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const upload = require('../middleware/multer');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');

router.get('/users/setup', authenticate, async (req, res) => {
  const user = await User.findById(req.userId);
  if (user.bio && user.profilePic !== '/uploads/default.png') {
    return res.redirect('/users/profile'); // Skip setup if already done
  }
  res.render('setupProfile', { user });
});

// POST: Handle setup form submission
router.post('/users/setup', authenticate, upload.single('profilePic'), async (req, res) => {
  const { bio, age, gender } = req.body;
  const profilePic = req.file ? '/uploads/profilePics/' + req.file.filename : '/uploads/default.png';

  await User.findByIdAndUpdate(req.userId, {
    bio,
    age,
    gender,
    profilePic
  });

  res.redirect('/users/profile');
});
//Edit profile

router.get('/users/edit', authenticate, async (req, res) => {
  const currentUser = await User.findById(req.userId);
  res.render('editprofile', { user: currentUser });
})

router.post('/users/edit', authenticate, upload.single('profilePic'), async (req, res) => {
  const {bio} = req.body;
  const updatedData = {bio};

  if (req.file) {
    profilePic = `/uploads/profilepics/${req.file.filename}`;
  }

await User.findByIdAndUpdate(req.userId, updatedData);
res.redirect('/users/profile');

})

router.get('/users/profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    const posts = await Post.find({ author: userId }).sort({ createdAt: -1 }).lean();
    res.render('profile', { user, posts });
  }
  catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send('Server Error');
  }
})
// follow and open the profile of user:=

router.post('/users/:id/follow', authenticate, async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  if (currentUserId === targetUserId) {
    return res.status(400).send('You cannot follow yourself.');
  }

  try {
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).send('User not found');
    }

    const alreadyFollowing = currentUser.following.includes(targetUserId);

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.redirect('/explore'); // go back to where the request came from
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//Favourite creators post :

router.get('/explore/following', authenticate, async (req, res) => {
  try {
    // Get current user
    const currentUser = await User.findById(req.userId);

    // Fetch all posts with author details, latest first
    const posts = await Post.find({ author: { $in: currentUser.following } })
      .populate('author', 'username profilePic followers') // to show name, picture, and follow status
      .populate('comments.user', 'username profilePic')  // for showing commenter's name and pic
      .sort({ createdAt: -1 });

    res.render('favourite', { user: currentUser, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/users/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
})
module.exports = router;

