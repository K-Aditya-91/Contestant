async function fetchCodeforces() {
  const res = await fetch('https://codeforces.com/api/contest.list');
  const data = await res.json();
  const now = Date.now() / 1000;

  return data.result
    .filter(c => c.phase === 'BEFORE' && c.startTimeSeconds - now < 7 * 24 * 60 * 60)
    .map(c => ({
      name: c.name,
      start: new Date(c.startTimeSeconds * 1000).toLocaleString(),
      platform: "Codeforces"
    }));
}

async function fetchAtCoder() {
  const res = await fetch('https://kontests.net/api/v1/at_coder');
  const data = await res.json();

  return data.map(c => ({
    name: c.name,
    start: new Date(c.start_time).toLocaleString(),
    platform: "AtCoder"
  }));
}

async function fetchLeetCode() {
  const res = await fetch('https://kontests.net/api/v1/leet_code');
  const data = await res.json();

  return data.map(c => ({
    name: c.name,
    start: new Date(c.start_time).toLocaleString(),
    platform: "LeetCode"
  }));
}

async function getContests() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["platforms"], async (data) => {
      const platforms = data.platforms || ["codeforces"];
      let all = [];

      if (platforms.includes("codeforces")) {
        all = all.concat(await fetchCodeforces());
      }
      if (platforms.includes("atcoder")) {
        all = all.concat(await fetchAtCoder());
      }
      if (platforms.includes("leetcode")) {
        all = all.concat(await fetchLeetCode());
      }

      resolve(all);
    });
  });
}

function notifyUpcoming(contests) {
  if (contests.length === 0) return;

  const sorted = contests.sort((a, b) => new Date(a.start) - new Date(b.start));
  const first = sorted[0];

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: `Upcoming Contest on ${first.platform}`,
    message: `${first.name}\nStarts at: ${first.start}`,
    priority: 2
  });
}

async function checkAndNotify() {
  const contests = await getContests();
  notifyUpcoming(contests);
}

chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started. Checking contests...');
  checkAndNotify();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed. Checking contests...');
  checkAndNotify();
});

chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked. Checking contests...');
  checkAndNotify();
});
