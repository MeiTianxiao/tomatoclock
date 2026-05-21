const fs = require('fs');
const https = require('https');
const path = require('path');

const icons = [
  { name: 'home', code: '1f4da' }, // 📚 books
  { name: 'leaderboard', code: '1f3c6' }, // 🏆 trophy
  { name: 'stats', code: '1f4ca' }, // 📊 bar chart
  { name: 'settings', code: '2699' } // ⚙️ gear
];

const dir = path.join(__dirname, 'src/static/icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let completed = 0;
icons.forEach(icon => {
  const filePath = path.join(dir, `${icon.name}.png`);
  const file = fs.createWriteStream(filePath);
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${icon.code}.png`;
  
  https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${icon.name}.png`);
      completed++;
      if (completed === icons.length) {
        updatePagesJson();
      }
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${icon.name}: ${err.message}`);
  });
});

function updatePagesJson() {
  const pagesPath = path.join(__dirname, 'src/pages.json');
  try {
    const pagesData = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
    
    pagesData.tabBar.list[0].iconPath = 'static/icons/home.png';
    pagesData.tabBar.list[0].selectedIconPath = 'static/icons/home.png';
    
    pagesData.tabBar.list[1].iconPath = 'static/icons/leaderboard.png';
    pagesData.tabBar.list[1].selectedIconPath = 'static/icons/leaderboard.png';
    
    pagesData.tabBar.list[2].iconPath = 'static/icons/stats.png';
    pagesData.tabBar.list[2].selectedIconPath = 'static/icons/stats.png';
    
    pagesData.tabBar.list[3].iconPath = 'static/icons/settings.png';
    pagesData.tabBar.list[3].selectedIconPath = 'static/icons/settings.png';

    fs.writeFileSync(pagesPath, JSON.stringify(pagesData, null, 2));
    console.log('Updated pages.json');
  } catch (e) {
    console.error('Failed to update pages.json:', e);
  }
}
