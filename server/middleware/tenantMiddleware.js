const { getSuperAdminModels, getTenantModels } = require('../config/connectionManager');

/**
 * Centralized Tenant Resolution & Isolation Middleware
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // 1. Resolve target companyCode from authenticated user context, header, body, or query
    let targetCode =
      req.user?.companyCode ||
      req.headers['x-company-code'] ||
      req.body?.companyCode ||
      req.query?.companyCode ||
      'maruti_nandan';

    targetCode = String(targetCode).toLowerCase().trim();

    // 2. Strict Cross-Tenant Enforcement for Authenticated Users
    // If request contains req.user (from authMiddleware), user MUST only access their own company
    if (req.user && req.user.companyCode) {
      const userCompanyCode = String(req.user.companyCode).toLowerCase().trim();
      if (targetCode !== userCompanyCode) {
        return res.status(403).json({
          success: false,
          message: 'Cross-tenant access denied. You can only access data for your authenticated company.'
        });
      }
      targetCode = userCompanyCode;
    }

    // 3. Validate target company against Super Admin catalog
    const { Company } = getSuperAdminModels();
    let company = await Company.findOne({ code: targetCode });

    // Fallback provisioning if company catalog not yet seeded
    if (!company) {
      const defaultNames = {
        maruti_nandan: 'MARUTI NANDAN DENIM PVT LTD',
        shri_ram: 'SHRI RAM COT FAB',
        balaji_polycot: 'BALAJI POLYCOT PVT. LTD.'
      };
      if (defaultNames[targetCode]) {
        company = {
          code: targetCode,
          name: defaultNames[targetCode],
          status: 'ACTIVE',
          dbName: `${targetCode}_db`
        };
      } else {
        return res.status(404).json({
          success: false,
          message: `Company '${targetCode}' not found or invalid.`
        });
      }
    }

    // Check if company access is active
    if (company.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Access to ${company.name} has been deactivated by system administrator.`
      });
    }

    // 4. Attach resolved tenant context to Express request
    req.companyCode = targetCode;
    req.company = company;
    req.tenantModels = getTenantModels(targetCode, company.dbName);

    next();
  } catch (error) {
    console.error('Tenant middleware resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resolving tenant database context.',
      error: error.message
    });
  }
};

module.exports = tenantMiddleware;
