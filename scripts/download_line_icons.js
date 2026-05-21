const fs = require('fs');
const https = require('https');
const path = require('path');

const icons = [
  { name: 'home', icon: 'home' },
  { name: 'leaderboard', icon: 'trending-up' },
  { name: 'stats', icon: 'bar-chart-2' },
  { name: 'settings', icon: 'settings' }
];

const dir = path.join(__dirname, 'src', 'static', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const { name, icon } of icons) {
    // Normal (Grey #999999)
    await downloadIcon(`https://api.iconify.design/lucide/${icon}.png?color=%23999999&width=81&height=81`, `${name}.png`);
    // Active (Blue #3b82f6)
    await downloadIcon(`https://api.iconify.design/lucide/${icon}.png?color=%233b82f6&width=81&height=81`, `${name}-active.png`);
  }
  console.log('All icons downloaded');
  updatePagesJson();
}

function downloadIcon(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const file = fs.createWriteStream(path.join(dir, filename));
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

function updatePagesJson() {
  const pagesPath = path.join(__dirname, 'src/pages.json');
  try {
    const pagesData = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
    
    pagesData.tabBar.list[0].iconPath = 'static/icons/home.png';
    pagesData.tabBar.list[0].selectedIconPath = 'static/icons/home-active.png';
    
    pagesData.tabBar.list[1].iconPath = 'static/icons/leaderboard.png';
    pagesData.tabBar.list[1].selectedIconPath = 'static/icons/leaderboard-active.png';
    
    pagesData.tabBar.list[2].iconPath = 'static/icons/stats.png';
    pagesData.tabBar.list[2].selectedIconPath = 'static/icons/stats-active.png';
    
    pagesData.tabBar.list[3].iconPath = 'static/icons/settings.png';
    pagesData.tabBar.list[3].selectedIconPath = 'static/icons/settings-active.png';

    fs.writeFileSync(pagesPath, JSON.stringify(pagesData, null, 2));
    console.log('Updated pages.json');
  } catch (e) {
    console.error('Failed to update pages.json:', e);
  }
}

download();
