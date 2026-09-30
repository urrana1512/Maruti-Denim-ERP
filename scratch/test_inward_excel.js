const http = require('http');
const fs = require('fs');
const path = require('path');

const url = 'http://localhost:5000/api/reports/export/excel?reportType=material-inward';

http.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed with status code:', res.statusCode);
    res.resume();
    return;
  }

  const outputPath = path.join(__dirname, 'test_inward_register.xlsx');
  const fileStream = fs.createWriteStream(outputPath);

  res.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Successfully generated Excel report at:', outputPath);
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size, 'bytes');
  });
}).on('error', (err) => {
  console.error('HTTP Error:', err.message);
});
