const { getSuperAdminModels } = require('../config/connectionManager');

// @desc    Get Active Companies Catalog for Public Selection Cards (Login / Register)
// @route   GET /api/companies/public
// @access  Public
exports.getPublicCompanies = async (req, res) => {
  try {
    const { Company } = getSuperAdminModels();
    
    let companies = await Company.find({ status: 'ACTIVE' })
      .select('name code address gstNo logoUrl status')
      .sort({ createdAt: 1 });

    // Fallback if super admin database is not seeded yet
    if (!companies || companies.length === 0) {
      companies = [
        {
          code: 'MARUTI_NANDAN',
          name: 'MARUTI NANDAN DENIM PVT LTD',
          shortCode: 'MND',
          address: 'Ahmedabad, Gujarat',
          gstNo: '24AAACM1234F1Z1',
          logoUrl: '/Maruti%20denim%20logo.png'
        },
        {
          code: 'SHRI_RAM_COT_FAB',
          name: 'SHRI RAM COT FAB',
          shortCode: 'SRCF',
          address: '84, Devraj Industrial Park, Piplaj Pirana Road, Ahmedabad - 382405.',
          gstNo: '24ACTFS8487N1ZV',
          logoUrl: '/Shri%20Ram%20logo.png'
        },
        {
          code: 'BALAJI_POLYCOT',
          name: 'BALAJI POLYCOT PVT. LTD.',
          shortCode: 'BPPL',
          address: '82, Devraj Industrial Park, Piplaj Pirana Road, Ahmedabad - 382405.',
          gstNo: '24AAECB8723G1ZT',
          logoUrl: '/balaji%20polycot%20logo.png'
        }
      ];
    }

    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching public companies catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading company catalog.',
      error: error.message
    });
  }
};
