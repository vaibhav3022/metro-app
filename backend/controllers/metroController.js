const MetroKnowledgeBase = require('../models/MetroKnowledgeBase');
const crypto = require('crypto');

// A placeholder static dataset in case the KB is empty
const defaultMetroData = {
  stations: [
    "PCMC", "Sant Tukaram Nagar", "Nashik Phata", "Kasarwadi", "Phugewadi", "Dapodi", 
    "Bopodi", "Khadki", "Range Hills", "Shivajinagar", "District Court", "Kasba Peth", 
    "Mahatma Phule Mandai", "Swargate", "Vanaz", "Anand Nagar", "Paud Phata", "SNDT", 
    "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan", "Pune Municipal Corporation", 
    "RTO", "Pune Railway Station", "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
  ],
  routes: {
    purple: ["PCMC", "Swargate"],
    aqua: ["Vanaz", "Ramwadi"]
  },
  fares: {
    baseFare: 10,
    perKmRate: 5
  }
};

exports.syncMetroData = async (req, res) => {
  try {
    let kb = await MetroKnowledgeBase.findOne().sort({ updatedAt: -1 });
    
    // If no knowledge base is present in DB, use default static data
    const syncData = kb ? {
      stations: kb.stations,
      routes: kb.routes,
      fares: kb.fares,
      timings: kb.timings,
      rules: kb.rules,
      version: kb.version
    } : { ...defaultMetroData, version: "1.0-default" };

    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(syncData))
      .digest('hex');

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end(); // Not Modified
    }

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).json({
      success: true,
      data: syncData
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync metro data' });
  }
};
