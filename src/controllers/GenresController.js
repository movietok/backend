import Genre from '../models/Genre.js';

export const getLocalGenres = async (req, res) => {
  try {
    const genres = await Genre.getAllGenres();
    res.json({
      success: true,
      genres
    });
  } catch (error) {
    console.error('Error fetching local genres:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};