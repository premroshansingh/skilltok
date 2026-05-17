/**
 * SkillTok API Integration Test
 * Tests the full chain: signup → login → /api/me → /api/feed → /api/notifications
 */

const BASE = "http://localhost:5000";
const USER = { username: `apitest_${Date.now()}`, password: "Test1234!", name: "API Tester" };

let cookieJar = "";

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(cookieJar ? { Cookie: cookieJar } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(BASE + path, opts);
  // capture Set-Cookie
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookieJar = setCookie.split(";")[0];
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { status: res.status, json };
}

function pass(label) { console.log(`  ✅  ${label}`); }
function fail(label, detail) { console.log(`  ❌  ${label}${detail ? " — " + detail : ""}`); }
function section(title) { console.log(`\n── ${title} ──`); }

async function run() {
  console.log("🔬 SkillTok API Integration Test");
  console.log(`   Testing user: ${USER.username}\n`);

  // 1. Signup
  section("Auth");
  let r = await req("POST", "/api/signup", USER);
  r.status === 200 && r.json.success ? pass("POST /api/signup → 200") : fail("POST /api/signup", `${r.status} ${JSON.stringify(r.json)}`);

  // 2. /api/me (should be authenticated now)
  r = await req("GET", "/api/me");
  if (r.status === 200 && r.json.success) {
    pass(`GET /api/me → 200 (name: ${r.json.user?.name}, handle: ${r.json.user?.handle})`);
  } else {
    fail("GET /api/me", `${r.status} ${JSON.stringify(r.json)}`);
  }

  // 3. Feed
  section("Feed & Discovery");
  r = await req("GET", "/api/feed?offset=0");
  r.status === 200 && r.json.success ? pass(`GET /api/feed → 200 (${r.json.videos?.length} videos)`) : fail("GET /api/feed", `${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);

  // 4. Leaderboard
  r = await req("GET", "/api/leaderboard");
  r.status === 200 && r.json.success ? pass(`GET /api/leaderboard → 200 (${r.json.leaderboard?.length} users)`) : fail("GET /api/leaderboard", `${r.status}`);

  // 5. Search
  r = await req("GET", "/api/search?q=test");
  r.status === 200 && r.json.success ? pass("GET /api/search → 200") : fail("GET /api/search", `${r.status}`);

  // 6. Notifications
  section("Social Features");
  r = await req("GET", "/api/notifications");
  r.status === 200 && r.json.success ? pass("GET /api/notifications → 200") : fail("GET /api/notifications", `${r.status}`);

  // 7. My videos
  r = await req("GET", "/api/my_videos");
  r.status === 200 && r.json.success ? pass("GET /api/my_videos → 200") : fail("GET /api/my_videos", `${r.status}`);

  // 8. Saved videos
  r = await req("GET", "/api/saved_videos");
  r.status === 200 && r.json.success ? pass("GET /api/saved_videos → 200") : fail("GET /api/saved_videos", `${r.status}`);

  // 9. Watch later
  r = await req("GET", "/api/watch_later");
  r.status === 200 && r.json.success ? pass("GET /api/watch_later → 200") : fail("GET /api/watch_later", `${r.status}`);

  // 10. Analytics
  r = await req("GET", "/api/analytics");
  r.status === 200 && r.json.success ? pass("GET /api/analytics → 200") : fail("GET /api/analytics", `${r.status}`);

  // 11. Playlists
  r = await req("GET", "/api/playlists");
  r.status === 200 && r.json.success ? pass("GET /api/playlists → 200") : fail("GET /api/playlists", `${r.status}`);

  // 12. Conversations
  r = await req("GET", "/api/conversations");
  r.status === 200 && r.json.success ? pass("GET /api/conversations → 200") : fail("GET /api/conversations", `${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);

  // 13. Messages
  r = await req("GET", "/api/messages");
  r.status === 200 && r.json.success ? pass("GET /api/messages → 200") : fail("GET /api/messages", `${r.status}`);

  // 14. Verification request
  section("Profile & Admin");
  r = await req("POST", "/api/verify/request");
  r.status === 200 && r.json.success ? pass("POST /api/verify/request → 200") : fail("POST /api/verify/request", `${r.status} ${r.json.message || ""}`);

  // 15. Profile update
  r = await req("POST", "/api/profile", { name: "API Tester Updated", bio: "Updated bio" });
  r.status === 200 && r.json.success ? pass("POST /api/profile → 200") : fail("POST /api/profile", `${r.status}`);

  // 16. Admin stats (should be 403 for non-admin)
  r = await req("GET", "/api/admin/stats");
  r.status === 403 ? pass("GET /api/admin/stats → 403 (correctly blocked for non-admin)") : fail("GET /api/admin/stats", `Expected 403, got ${r.status}`);

  // 17. Logout
  section("Logout");
  r = await req("POST", "/api/logout");
  r.status === 200 && r.json.success ? pass("POST /api/logout → 200") : fail("POST /api/logout", `${r.status}`);

  // 18. /api/me after logout (should be 401)
  r = await req("GET", "/api/me");
  r.status === 401 ? pass("GET /api/me after logout → 401 ✓ (correct)") : fail("GET /api/me after logout", `Expected 401, got ${r.status}`);

  console.log("\n✨ Test complete.\n");
}

run().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
