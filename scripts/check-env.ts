const required = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) { console.error("Missing env:", missing.join(", ")); process.exit(1); }
console.log("Env OK");
