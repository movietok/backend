import Review from '../models/Reviews.js';

export const createReview = async (req, res) => {
  try {
    const { movie_id, content, rating } = req.body;
    const user_id = req.user.id; // From auth middleware

    const review = await Review.create({
      movie_id,
      user_id,
      content,
      rating
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMovieReviews = async (req, res) => {
  try {
    const reviews = await Review.findByMovieId(req.params.movieId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.findByUserId(req.params.userId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the user is the owner of the review
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const { content, rating } = req.body;
    const updatedReview = await Review.update(req.params.id, { content, rating });
    
    res.json(updatedReview);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the user is the owner of the review
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addReviewInteraction = async (req, res) => {
  try {
    const { type } = req.body; // 'like' or 'dislike'
    const reviewId = req.params.id;
    const userId = req.user.id;

    if (!['like', 'dislike', null].includes(type)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }

    const review = await Review.addInteraction(reviewId, userId, type);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};