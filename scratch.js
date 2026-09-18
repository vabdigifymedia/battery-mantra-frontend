const https = require('https');
https.get('https://api.batterymantra.com/api/v1/categories', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const lithium = json.content.find(c => c.categoryName.toLowerCase().includes('lithium'));
    console.log(JSON.stringify(lithium, null, 2));
  });
});
