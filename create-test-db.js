const Database = require("better-sqlite3");
const db = new Database("./test-db/test.db");
db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");
db.exec(
    "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com'), ('Jane Smith', 'jane@example.com')"
);
db.close();
console.log("Test database created");
