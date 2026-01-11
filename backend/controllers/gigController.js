const Gig = require('../models/Gig');

// @desc    Get all gigs with search
// @route   GET /api/gigs
// @access  Public
exports.getAllGigs = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const gigs = await Gig.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(gigs);
  } catch (error) {
    console.error('❌ Get gigs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new gig
// @route   POST /api/gigs
// @access  Private
exports.createGig = async (req, res) => {
  try {
    const { title, description, budget } = req.body;

    // Validation
    if (!title || !description || !budget) {
      return res.status(400).json({ 
        message: 'Please provide all fields' 
      });
    }

    if (budget <= 0) {
      return res.status(400).json({ 
        message: 'Budget must be greater than 0' 
      });
    }

    const gig = await Gig.create({
      title,
      description,
      budget,
      ownerId: req.user._id
    });

    const populatedGig = await Gig.findById(gig._id)
      .populate('ownerId', 'name email');

    console.log('✅ Gig created:', gig._id);
    
    res.status(201).json(populatedGig);
  } catch (error) {
    console.error('❌ Create gig error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single gig
// @route   GET /api/gigs/:id
// @access  Public
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('ownerId', 'name email');
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    res.json(gig);
  } catch (error) {
    console.error('❌ Get gig error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update gig
// @route   PUT /api/gigs/:id
// @access  Private (Owner only)
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check ownership
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this gig' 
      });
    }

    const { title, description, budget } = req.body;

    if (title) gig.title = title;
    if (description) gig.description = description;
    if (budget) gig.budget = budget;

    await gig.save();

    const updatedGig = await Gig.findById(gig._id)
      .populate('ownerId', 'name email');

    res.json(updatedGig);
  } catch (error) {
    console.error('❌ Update gig error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete gig
// @route   DELETE /api/gigs/:id
// @access  Private (Owner only)
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check ownership
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this gig' 
      });
    }

    await gig.deleteOne();

    res.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('❌ Delete gig error:', error);
    res.status(500).json({ message: error.message });
  }
};