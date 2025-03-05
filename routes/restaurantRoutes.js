const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController'); // Fixed path

// Define routes
router.get('/:id', restaurantController.getRestaurantInfo);

module.exports = router;