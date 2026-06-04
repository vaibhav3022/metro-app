const Complaint = require('../models/Complaint');

// @desc    Submit a new complaint
// @route   POST /api/complaints/submit
// @access  Private
const submitComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required.' });
    }

    const complaint = await Complaint.create({
      userId: req.user.id,
      category,
      description
    });

    res.status(201).json({ success: true, complaint, message: 'Complaint submitted successfully. Our team will look into it.' });
  } catch (error) {
    console.error('Submit Complaint Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user complaints
// @route   GET /api/complaints
// @access  Private
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints
};
