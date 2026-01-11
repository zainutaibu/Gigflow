const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Gig = require('../models/Gig');

// @desc    Submit a bid
// @route   POST /api/bids
// @access  Private
exports.createBid = async (req, res) => {
  try {
    const { gigId, message, price } = req.body;

    // Validation
    if (!gigId || !message || !price) {
      return res.status(400).json({ 
        message: 'Please provide all fields' 
      });
    }

    if (price <= 0) {
      return res.status(400).json({ 
        message: 'Price must be greater than 0' 
      });
    }

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ 
        message: 'This gig is no longer open' 
      });
    }

    // Check if user is trying to bid on their own gig
    if (gig.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot bid on your own gig' 
      });
    }

    // Check if user already bid on this gig
    const existingBid = await Bid.findOne({ 
      gigId, 
      freelancerId: req.user._id 
    });

    if (existingBid) {
      return res.status(400).json({ 
        message: 'You have already bid on this gig' 
      });
    }

    // Create bid
    const bid = await Bid.create({
      gigId,
      freelancerId: req.user._id,
      message,
      price
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title');

    console.log('✅ Bid created:', bid._id);

    res.status(201).json(populatedBid);
  } catch (error) {
    console.error('❌ Create bid error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bids for a gig
// @route   GET /api/bids/:gigId
// @access  Private (Owner only)
exports.getBidsForGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check if user is the owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to view bids' 
      });
    }

    const bids = await Bid.find({ gigId: req.params.gigId })
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error('❌ Get bids error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hire a freelancer (with MongoDB transaction)
// @route   PATCH /api/bids/:bidId/hire
// @access  Private (Owner only)
exports.hireBid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bid = await Bid.findById(req.params.bidId).session(session);
    
    if (!bid) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Bid not found' });
    }

    const gig = await Gig.findById(bid.gigId).session(session);
    
    if (!gig) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check if user is the owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ 
        message: 'Not authorized to hire for this gig' 
      });
    }

    // Check if gig is still open (race condition prevention)
    if (gig.status !== 'open') {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'This gig has already been assigned' 
      });
    }

    // Update gig status to assigned
    gig.status = 'assigned';
    await gig.save({ session });

    // Update hired bid
    bid.status = 'hired';
    await bid.save({ session });

    // Reject all other bids
    await Bid.updateMany(
      { 
        gigId: bid.gigId, 
        _id: { $ne: bid._id },
        status: 'pending'
      },
      { status: 'rejected' },
      { session }
    );

    await session.commitTransaction();
    console.log('✅ Freelancer hired:', bid._id);

    // Populate the bid
    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title');

    // Send real-time notification via Socket.io
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const freelancerSocketId = userSockets.get(bid.freelancerId.toString());

    if (freelancerSocketId) {
      io.to(freelancerSocketId).emit('hired', {
        message: `You have been hired for "${gig.title}"!`,
        gigId: gig._id,
        gigTitle: gig.title,
        bidId: bid._id
      });
      console.log('📨 Notification sent to freelancer');
    }

    res.json(populatedBid);
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Hire bid error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get user's own bids
// @route   GET /api/bids/user/my-bids
// @access  Private
exports.getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ freelancerId: req.user._id })
      .populate('gigId', 'title budget status')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error('❌ Get my bids error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update bid
// @route   PUT /api/bids/:id
// @access  Private (Bid owner only)
exports.updateBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check ownership
    if (bid.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this bid' 
      });
    }

    // Can only update if bid is still pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Can only update pending bids' 
      });
    }

    const { message, price } = req.body;

    if (message) bid.message = message;
    if (price) bid.price = price;

    await bid.save();

    const updatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title');

    res.json(updatedBid);
  } catch (error) {
    console.error('❌ Update bid error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete bid
// @route   DELETE /api/bids/:id
// @access  Private (Bid owner only)
exports.deleteBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check ownership
    if (bid.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this bid' 
      });
    }

    // Can only delete if bid is still pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Can only delete pending bids' 
      });
    }

    await bid.deleteOne();

    res.json({ message: 'Bid deleted successfully' });
  } catch (error) {
    console.error('❌ Delete bid error:', error);
    res.status(500).json({ message: error.message });
  }
};