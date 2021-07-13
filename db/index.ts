import path from "path";
import sqlite3 from "sqlite3";

const db = new (sqlite3.verbose().Database)(
  path.resolve(__dirname, "local.db")
);

export default db;
