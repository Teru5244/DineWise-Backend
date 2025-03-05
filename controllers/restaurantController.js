const axios = require('axios');

const getRestaurantInfo = async (req, res) => {
  const { id } = req.params;

  try {
    // Replace this with actual API calls or database queries
    const restaurant = {
      id,
      name: 'Sample Restaurant',
      address: '123 Main St, City, Country',
      phone: '+1234567890',
      openingHours: '9:00 AM - 10:00 PM',
      website: 'https://samplerestaurant.com',
      queue: 15, // Example: Number of people in the online queue
      foodInfo: 'Serves Italian cuisine with a focus on pasta and pizza.',
    };

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant information', error });
  }
};

module.exports = { getRestaurantInfo };