const Enquiry = require('../models/Enquiry');

// @desc    Submit a new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, country, enquiryType, message } = req.body;

    if (!name || !email || !phone || !country || !enquiryType || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      country,
      enquiryType,
      message
    });

    res.status(201).json({
      success: true,
      enquiry,
      message: 'Thank you for your enquiry. We will get back to you soon!'
    });
  } catch (error) {
    console.error('Create Enquiry Error:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
  }
};

module.exports = {
  createEnquiry
};
