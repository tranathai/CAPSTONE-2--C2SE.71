import "dotenv/config";

const baseUrl = process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;

async function call(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function run() {
  await call("/health");
  const email = `smoke_${Date.now()}@gmail.com`;
  const password = "SmokeTest123";
  const registerRes = await call("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!registerRes.pendingToken) {
    throw new Error("register did not return pendingToken");
  }
  const loginRes = await call("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.pendingToken) {
    throw new Error("login did not return pendingToken");
  }
  console.log("Smoke test passed (auth 2FA stage-1).");
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
