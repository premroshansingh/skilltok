import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "skilltok.db");

const db = new Database(dbPath);
const info = db.prepare('PRAGMA table_info(users)').all();
console.log(JSON.stringify(info, null, 2));
db.close();
