const express = require('express');
const router = express.Router();
const uploadPostMedia = require('../middleware/uploadPostMedia'); // from above
const verifyUser = require('../middleware/authenticate');
const User = require('../models/User');
const Post = require('../models/Post');
const path = require('path');

// GET /posts/create - Render the form
router.get('/posts/create', verifyUser, (req, res) => {
    res.render('createpost');
});

// POST /posts/create - Handle form submission
router.post('/posts/create', verifyUser, uploadPostMedia.single('media'), async (req, res) => {
    const { caption } = req.body;
    const mediaFile = req.file;

    if (!mediaFile) {
        return res.status(400).send('Media file is required');
    }

    const mediaUrl = `/uploads/posts/${mediaFile.filename}`;
    const mediaType = mediaFile.mimetype.startsWith('video') ? 'video' : 'image';

    try {
        const newPost = new Post({
            author: req.userId,
            caption,
            mediaUrl,
            mediaType
        });

        await newPost.save();
        res.redirect('/users/profile'); // Redirect to profile page
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// post edit and delete by the authorized user :=
// GET Edit Caption Page
router.get('/posts/:id/edit', verifyUser, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    if (post.author.toString() !== req.userId) {
        return res.status(403).send('Unauthorized');
    }

    res.render('editPost', { post });
});

// POST Update Caption Only
router.post('/posts/:id/update-caption', verifyUser, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    if (post.author.toString() !== req.userId) {
        return res.status(403).send('Unauthorized');
    }

    post.caption = req.body.caption;
    await post.save();
    res.redirect('/users/profile');
});

//Delete the Post:
router.post('/posts/:id/delete', verifyUser, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    if (post.author.toString() !== req.userId) {
        return res.status(403).send('Unauthorized');
    }

    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/users/profile');
});

//lets make like routes :

// POST /posts/:id/like - toggle like
router.post('/posts/:id/like', verifyUser, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');
  
    const userId = req.userId;
  
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1); // unlike
    }
  
    await post.save();
    res.redirect('/explore'); // return to the same page
  });
  
//comment-box :
  router.post('/posts/:id/comment', verifyUser, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');
  
    const { text } = req.body;
    post.comments.push({
      user: req.userId,
      text
    });
  console.log(text);
  
    await post.save();
    res.redirect('/explore');
  });

  // Explore / Home Page : -
router.get('/explore',verifyUser,async(req,res)=>{
    try {
        // Get current user
        const currentUser = await User.findById(req.userId);
    
        // Fetch all posts with author details, latest first
        const posts = await Post.find()
          .populate('author', 'username profilePic followers') // to show name, picture, and follow status
          .populate('comments.user', 'username profilePic')  // for showing commenter's name and pic
          .sort({ createdAt: -1 });
    
        res.render('explore', { user: currentUser, posts });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
    });


module.exports = router;
