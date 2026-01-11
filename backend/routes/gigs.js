const express = require('express');
const {
  getAllGigs,
  createGig,
  getGigById,
  updateGig,
  deleteGig
} = require('../controllers/gigController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getAllGigs)
  .post(protect, createGig);

router.route('/:id')
  .get(getGigById)
  .put(protect, updateGig)
  .delete(protect, deleteGig);

module.exports = router;