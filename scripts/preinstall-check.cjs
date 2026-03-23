const { existsSync, unlinkSync } = require("node:fs");

function safeUnlink(path) {
  try {
    if (existsSync(path)) unlinkSync(path);
  } catch {
    // best-effort cleanup only
  }
}

safeUnlink("package-lock.json");
safeUnlink("yarn.lock");

const ua = String(process.env.npm_config_user_agent || "");
if (!ua.startsWith("pnpm/")) {
  console.error("Use pnpm instead (detected user agent: " + ua + ")");
  process.exit(1);
}

