document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("platformForm");
  const output = document.getElementById("contestOutput");
  const status = document.getElementById("status");

  chrome.storage.sync.get("platforms", (data) => {
    const saved = data.platforms || [];
    saved.forEach(site => {
      const checkbox = form.querySelector(`input[value="${site}"]`);
      if (checkbox) checkbox.checked = true;
    });

    fetchAndDisplayContests(saved);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = Array.from(form.querySelectorAll("input[type='checkbox']:checked"))
      .map(input => input.value);

    chrome.storage.sync.set({ platforms: selected }, () => {
      status.textContent = "Saved!";
      setTimeout(() => status.textContent = "", 1500);
      fetchAndDisplayContests(selected); 
    });
  });

  async function fetchAndDisplayContests(platforms) {
  output.innerHTML = "Loading...";
  let contests = [];

  const fetchers = [];

  if (platforms.includes("codeforces")) {
    fetchers.push(
      fetch("https://codeforces.com/api/contest.list")
        .then(res => res.json())
        .then(data => {
          const now = Date.now() / 1000;
          return data.result
            .filter(c => c.phase === "BEFORE" && c.startTimeSeconds > now)
            .map(c => ({
              name: c.name,
              start: new Date(c.startTimeSeconds * 1000).toLocaleString(),
              platform: "Codeforces"
            }));
        })
    );
  }

  if (platforms.includes("atcoder")) {
    fetchers.push(
      fetch("https://kontests.net/api/v1/at_coder")
        .then(res => res.json())
        .then(data =>
          data.map(c => ({
            name: c.name,
            start: new Date(c.start_time).toLocaleString(),
            platform: "AtCoder"
          }))
        )
    );
  }

  if (platforms.includes("leetcode")) {
    fetchers.push(
      fetch("https://kontests.net/api/v1/leet_code")
        .then(res => res.json())
        .then(data =>
          data.map(c => ({
            name: c.name,
            start: new Date(c.start_time).toLocaleString(),
            platform: "LeetCode"
          }))
        )
    );
  }

  try {
    const results = await Promise.allSettled(fetchers);

    results.forEach(result => {
      if (result.status === "fulfilled") {
        contests = contests.concat(result.value);
      }
    });

    if (contests.length === 0) {
      output.innerHTML = "No upcoming contests.";
      return;
    }

    contests.sort((a, b) => new Date(a.start) - new Date(b.start));

    output.innerHTML = contests.map(c =>
      `<div class="contest">
         <b>${c.platform}</b>
         ${c.name}<br>
         <small>${c.start}</small>
       </div>`
    ).join("");

  } catch (err) {
    console.error("Unexpected error:", err);
    output.innerHTML = "No upcoming contests.";
  }
}
});
