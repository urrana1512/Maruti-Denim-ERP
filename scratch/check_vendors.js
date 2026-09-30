const http = require('http');

function request(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function check() {
  try {
    const res = await request('GET', '/master-data/vendors');
    console.log('ACTIVE VENDORS IN DB:');
    console.dir(res.data, { depth: null });
  } catch (err) {
    console.error('Error fetching vendors:', err);
  }
}

check();
