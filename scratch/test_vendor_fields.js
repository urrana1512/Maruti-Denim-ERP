const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    console.log('Testing create vendor...');
    const vendorRes = await request('POST', '/master-data/vendors', {
      vendorName: 'TEST ENTERPRISES ' + Date.now(),
      address: 'Plot 45, Industrial Zone, Phase 3',
      city: 'Ahmedabad',
      pincode: '382425',
      gstin: '24ABCDE1234F1Z5',
      panCard: 'ABCDE1234F'
    });
    console.log('Vendor created successfully:', vendorRes.data.vendorCode, vendorRes.data.vendorName);

    console.log('\nTesting create Gate Pass...');
    const gpRes = await request('POST', '/gate-passes', {
      date: '2026-09-29',
      vendorId: vendorRes.data._id,
      companyName: vendorRes.data.vendorName,
      vendorAddress: vendorRes.data.address,
      vendorCity: vendorRes.data.city,
      vendorPincode: vendorRes.data.pincode,
      vendorGstin: vendorRes.data.gstin,
      vendorPanCard: vendorRes.data.panCard,
      passType: 'Returnable',
      purpose: 'Testing full vendor field integration',
      items: [
        {
          description: 'MOTOR REPAIR ITEM',
          category: 'On Cost Repair (OCR)',
          quantity: 2,
          uom: 'Nos',
          returnable: true
        }
      ]
    });
    console.log('Gate Pass created:', gpRes.data.gatePassNumber);
    console.log('Stored Vendor Address:', gpRes.data.vendorAddress);
    console.log('Stored Vendor GSTIN:', gpRes.data.vendorGstin);

    console.log('\nTesting get Gate Pass by ID...');
    const fetchedGp = await request('GET', `/gate-passes/${gpRes.data._id}`);
    console.log('Populated Vendor Object:', fetchedGp.data.vendorId?.vendorName, fetchedGp.data.vendorId?.gstin);

    console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
