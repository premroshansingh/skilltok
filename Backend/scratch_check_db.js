import "dotenv/config";
import { pool } from "./db.js";

try {
  const res = await pool.query("SELECT * FROM videos ORDER BY timestamp DESC LIMIT 10");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
