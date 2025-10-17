import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import * as path from "path";
import * as fs from "fs";
import { FileLogger } from "./fileLogger";

const logger = new FileLogger("DatabaseService");

export interface TableInfo {
    name: string;
    sql: string;
    type: string;
}
export interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
}
export interface QueryResult {
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTime: number;
}
export interface ExportResult {
    success: boolean;
    error?: string;
}
export interface ImportResult {
    success: boolean;
    error?: string;
}
export interface ExecuteRawResult {
    success: boolean;
    result?: any;
    error?: string;
}

function sanitizeIdentifier(identifier: string) {
    if (!identifier) throw new Error("Identifier required");
    if (!/^[A-Za-z0-9_\$]+$/.test(identifier))
        throw new Error(`Invalid identifier: ${identifier}`);
    return identifier;
}

export class DatabaseService {
    private dbs: Map<string, Database.Database> = new Map();
    private mysqlConnections: Map<string, mysql.Connection> = new Map();

    /**
     * Get site configuration to determine database type
     */
    private getSiteConfig(siteName: string): any {
        const sitesDir = path.join(
            process.env.HOME || process.env.USERPROFILE || "",
            "PressBox",
            "sites"
        );
        const configPath = path.join(
            sitesDir,
            siteName,
            "pressbox-config.json"
        );

        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, "utf-8"));
        }
        return null;
    }

    /**
     * Get MySQL connection
     */
    private async getMySQLConnection(
        siteName: string
    ): Promise<mysql.Connection> {
        if (this.mysqlConnections.has(siteName)) {
            return this.mysqlConnections.get(siteName)!;
        }

        const config = this.getSiteConfig(siteName);
        if (!config) {
            throw new Error(`Site configuration not found: ${siteName}`);
        }

        const connection = await mysql.createConnection({
            host: config.databaseHost || "localhost",
            port: config.databasePort || 3306,
            user: config.databaseUser || "root",
            password: config.databasePassword || "",
            database: config.databaseName || "wordpress",
        });

        this.mysqlConnections.set(siteName, connection);
        logger.info(`MySQL connection established for site: ${siteName}`);
        return connection;
    }

    private openDatabase(dbPath: string) {
        if (!fs.existsSync(dbPath))
            throw new Error(`Database file not found: ${dbPath}`);
        const db = new Database(dbPath, { readonly: false });
        try {
            db.pragma("journal_mode = WAL");
        } catch (_) {}
        return db;
    }

    private getDatabase(dbPath: string) {
        if (!this.dbs.has(dbPath)) {
            const db = this.openDatabase(dbPath);
            this.dbs.set(dbPath, db);
            logger.info(`Opened database: ${dbPath}`);
        }
        return this.dbs.get(dbPath)!;
    }

    getDatabasePath(siteNameOrPath: string): string {
        if (!siteNameOrPath) throw new Error("siteNameOrPath required");
        if (
            path.isAbsolute(siteNameOrPath) &&
            fs.existsSync(siteNameOrPath) &&
            path.extname(siteNameOrPath) === ".db"
        )
            return siteNameOrPath;
        if (
            fs.existsSync(siteNameOrPath) &&
            path.extname(siteNameOrPath) === ".db"
        )
            return path.resolve(siteNameOrPath);

        const sitesDir = path.join(
            process.env.HOME || process.env.USERPROFILE || "",
            "PressBox",
            "sites"
        );
        const primary = path.join(
            sitesDir,
            siteNameOrPath,
            "database",
            "wordpress.db"
        );
        if (fs.existsSync(primary)) return primary;
        const alt = path.join(sitesDir, siteNameOrPath, "wordpress.db");
        if (fs.existsSync(alt)) return alt;
        return primary;
    }

    getTables(siteNameOrPath: string): TableInfo[] | Promise<TableInfo[]> {
        const config = this.getSiteConfig(siteNameOrPath);

        // Check if this is a MySQL or MariaDB site
        if (
            config &&
            (config.database === "mysql" || config.database === "mariadb")
        ) {
            return this.getMySQLTables(siteNameOrPath);
        }

        // SQLite path
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        return db
            .prepare(
                "SELECT name, sql, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
            .all() as TableInfo[];
    }

    private async getMySQLTables(siteName: string): Promise<TableInfo[]> {
        const connection = await this.getMySQLConnection(siteName);
        const [rows] = await connection.query("SHOW FULL TABLES");

        return (rows as any[]).map((row) => {
            const tableName = Object.values(row)[0] as string;
            const tableType = Object.values(row)[1] as string;
            return {
                name: tableName,
                type: tableType === "VIEW" ? "view" : "table",
                sql: "",
            };
        });
    }

    getTableSchema(siteNameOrPath: string, tableName: string): ColumnInfo[] {
        sanitizeIdentifier(tableName);
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        return db
            .prepare(`PRAGMA table_info(${tableName})`)
            .all() as ColumnInfo[];
    }

    getTableIndexes(siteNameOrPath: string, tableName: string) {
        sanitizeIdentifier(tableName);
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        const list = db
            .prepare(`PRAGMA index_list(${tableName})`)
            .all() as any[];
        for (const idx of list) {
            try {
                idx.info = db.prepare(`PRAGMA index_info(${idx.name})`).all();
            } catch (_) {
                idx.info = [];
            }
        }
        return list;
    }

    getTableData(
        siteNameOrPath: string,
        tableName: string,
        page: number = 1,
        pageSize: number = 100,
        searchTerm?: string,
        searchColumn?: string
    ): QueryResult {
        sanitizeIdentifier(tableName);
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        const cols = this.getTableSchema(siteNameOrPath, tableName).map(
            (c) => c.name
        );

        let where = "";
        const params: any[] = [];
        if (searchTerm && searchColumn) {
            if (!cols.includes(searchColumn))
                throw new Error("Invalid search column");
            where = `WHERE ${searchColumn} LIKE ?`;
            params.push(`%${searchTerm}%`);
        }

        const offset = (page - 1) * pageSize;
        const sql = `SELECT * FROM ${tableName} ${where} LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const start = Date.now();
        const rows = db.prepare(sql).all(...params) as any[];
        const duration = Date.now() - start;
        const outCols = rows.length ? Object.keys(rows[0]) : cols;
        return {
            columns: outCols,
            rows,
            rowCount: rows.length,
            executionTime: duration,
        };
    }

    getTableRowCount(
        siteNameOrPath: string,
        tableName: string,
        searchTerm?: string,
        searchColumn?: string
    ): number {
        sanitizeIdentifier(tableName);
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        const cols = this.getTableSchema(siteNameOrPath, tableName).map(
            (c) => c.name
        );
        let where = "";
        const params: any[] = [];
        if (searchTerm && searchColumn) {
            if (!cols.includes(searchColumn))
                throw new Error("Invalid search column");
            where = `WHERE ${searchColumn} LIKE ?`;
            params.push(`%${searchTerm}%`);
        }
        const res = db
            .prepare(`SELECT COUNT(*) as count FROM ${tableName} ${where}`)
            .get(...params) as any;
        return res?.count || 0;
    }

    query(
        siteNameOrPath: string,
        sql: string,
        params: any[] = []
    ): QueryResult {
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        const start = Date.now();
        const stmt = db.prepare(sql);
        const rows = stmt.all(...(params || [])) as any[];
        const duration = Date.now() - start;
        const cols = rows.length ? Object.keys(rows[0]) : [];
        return {
            columns: cols,
            rows,
            rowCount: rows.length,
            executionTime: duration,
        };
    }

    execute(siteNameOrPath: string, sql: string, params: any[] = []) {
        const db = this.getDatabase(this.getDatabasePath(siteNameOrPath));
        const stmt = db.prepare(sql);
        const res = stmt.run(...(params || []));
        return {
            changes: res.changes,
            lastInsertRowid: res.lastInsertRowid,
        } as const;
    }

    insertRow(
        siteNameOrPath: string,
        tableName: string,
        data: Record<string, any>
    ) {
        sanitizeIdentifier(tableName);
        const columns = Object.keys(data);
        const placeholders = columns.map(() => "?").join(", ");
        const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;
        const values = Object.values(data);
        const res = this.execute(siteNameOrPath, sql, values);
        return { success: true, id: res.lastInsertRowid };
    }

    updateRow(
        siteNameOrPath: string,
        tableName: string,
        data: Record<string, any>,
        whereClause: string,
        whereParams: any[]
    ) {
        sanitizeIdentifier(tableName);
        const columns = Object.keys(data);
        const setClause = columns.map((col) => `${col} = ?`).join(", ");
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        const values = Object.values(data);
        const res = this.execute(siteNameOrPath, sql, [
            ...values,
            ...(whereParams || []),
        ]);
        return { success: true, changes: res.changes };
    }

    deleteRow(
        siteNameOrPath: string,
        tableName: string,
        whereClause: string,
        whereParams: any[]
    ) {
        sanitizeIdentifier(tableName);
        const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        const res = this.execute(siteNameOrPath, sql, whereParams || []);
        return { success: true, changes: res.changes };
    }

    async exportDatabase(
        siteNameOrPath: string,
        exportPath: string,
        tables?: string[]
    ): Promise<ExportResult> {
        try {
            const dbPath = this.getDatabasePath(siteNameOrPath);
            const db = this.getDatabase(dbPath);
            const tablesResult = this.getTables(siteNameOrPath);
            const allTables = (await Promise.resolve(tablesResult)).map(
                (t: TableInfo) => t.name
            );
            const targetTables =
                tables && tables.length
                    ? tables.filter((t) => allTables.includes(t))
                    : allTables;

            let out = "-- PressBox Database Export\n";
            for (const table of targetTables) {
                const tinfo = db
                    .prepare(
                        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
                    )
                    .get(table) as any;
                if (tinfo && tinfo.sql)
                    out += `DROP TABLE IF EXISTS ${table};\n${tinfo.sql};\n\n`;
                const rows = db.prepare(`SELECT * FROM ${table}`).all();
                for (const row of rows as any[]) {
                    const cols = Object.keys(row);
                    const vals = cols.map((c) => {
                        const v = row[c];
                        if (v === null || v === undefined) return "NULL";
                        if (typeof v === "number") return v;
                        return `'${String(v).replace(/'/g, "''")}'`;
                    });
                    out += `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")});\n`;
                }
                out += "\n";
            }
            fs.writeFileSync(exportPath, out, "utf-8");
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async importDatabase(
        siteNameOrPath: string,
        importPath: string
    ): Promise<ImportResult> {
        try {
            const dbPath = this.getDatabasePath(siteNameOrPath);
            const db = this.getDatabase(dbPath);
            const sql = fs.readFileSync(importPath, "utf-8");
            const statements = sql
                .split(/;\s*\n/)
                .map((s) => s.trim())
                .filter((s) => s && !s.startsWith("--"));
            db.exec("BEGIN");
            for (const stmt of statements) {
                if (!stmt) continue;
                db.exec(stmt);
            }
            db.exec("COMMIT");
            return { success: true };
        } catch (error) {
            try {
                const dbPath = this.getDatabasePath(siteNameOrPath);
                const db = this.dbs.get(dbPath);
                if (db) db.exec("ROLLBACK");
            } catch (_) {}
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    executeRaw(siteNameOrPath: string, sql: string): ExecuteRawResult {
        try {
            if (sql.trim().toLowerCase().startsWith("select")) {
                const res = this.query(siteNameOrPath, sql);
                return { success: true, result: res };
            }
            const res = this.execute(siteNameOrPath, sql);
            return { success: true, result: res };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    closeDatabase(siteNameOrPath: string): void {
        const dbPath = this.getDatabasePath(siteNameOrPath);
        const db = this.dbs.get(dbPath);
        if (db) {
            try {
                db.close();
            } catch (_) {}
            this.dbs.delete(dbPath);
            logger.info(`Closed database: ${dbPath}`);
        }
    }

    closeAll(): void {
        for (const [k, db] of this.dbs.entries()) {
            try {
                db.close();
            } catch (_) {}
            this.dbs.delete(k);
        }
    }
}

export const databaseService = new DatabaseService();
