const BlogPost = require('../models/BlogPost');

const getPublicPosts = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPosts = async (req, res, next) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!post) {
      res.status(404);
      throw new Error('Article introuvable');
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPostById = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Article introuvable');
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const post = await BlogPost.create(req.body);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      return next(new Error('Un article avec ce titre existe deja'));
    }

    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!post) {
      res.status(404);
      throw new Error('Article introuvable');
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      return next(new Error('Un article avec ce titre existe deja'));
    }

    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Article introuvable');
    }

    res.status(200).json({
      success: true,
      message: 'Article supprime'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPosts,
  getAdminPosts,
  getPostBySlug,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost
};
