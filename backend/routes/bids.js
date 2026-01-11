const express = require('express');
const {
  createBid,
  getBidsForGig,
  hireBid,
  getMyBids,
  updateBid,
  deleteBid
} = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBid);
router.get('/user/my-bids', protect, getMyBids);
router.get('/:gigId', protect, getBidsForGig);
router.patch('/:bidId/hire', protect, hireBid);
router.put('/:id', protect, updateBid);
router.delete('/:id', protect, deleteBid);

module.exports = router;