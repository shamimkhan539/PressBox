import { BrowserWindow } from "electron";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { FileLogger } from "./fileLogger";

const logger = new FileLogger("DatabaseBrowserService");

/**
 * Database Browser Service
 * Provides a web-based database management interface similar to Adminer/phpMyAdmin
 */
export class DatabaseBrowserService {
    private server: http.Server | null = null;
    private browserWindow: BrowserWindow | null = null;
    private port: number = 0;

    /**
     * Open database browser for a specific site
     */
    async openDatabaseBrowser(siteName: string): Promise<void> {
        try {
            // Get site configuration
            const siteConfig = this.getSiteConfig(siteName);

            if (!siteConfig) {
                throw new Error(
                    `Site configuration not found for: ${siteName}`
                );
            }

            // Start the database browser server
            await this.startServer(siteConfig);

            // Open browser window
            this.openBrowserWindow();

            logger.info(`Database browser opened for site: ${siteName}`);
        } catch (error) {
            logger.error("Failed to open database browser:", error);
            throw error;
        }
    }

    /**
     * Get site configuration
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

        if (!fs.existsSync(configPath)) {
            return null;
        }

        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        return {
            ...config,
            siteName,
            sitePath: path.join(sitesDir, siteName),
        };
    }

    /**
     * Start HTTP server for database management UI
     */
    private async startServer(siteConfig: any): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create a simple HTTP server that serves database management UI
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res, siteConfig);
            });

            // Find available port
            this.server.listen(0, "127.0.0.1", () => {
                const address = this.server!.address();
                if (address && typeof address === "object") {
                    this.port = address.port;
                    logger.info(
                        `Database browser server started on port ${this.port}`
                    );
                    resolve();
                } else {
                    reject(new Error("Failed to get server address"));
                }
            });

            this.server.on("error", (error) => {
                logger.error("Server error:", error);
                reject(error);
            });
        });
    }

    /**
     * Handle HTTP requests
     */
    private handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        siteConfig: any
    ): void {
        res.setHeader("Content-Type", "text/html; charset=utf-8");

        // Serve the database browser UI
        const html = this.generateDatabaseBrowserUI(siteConfig);
        res.writeHead(200);
        res.end(html);
    }

    /**
     * Generate database browser UI HTML
     */
    private generateDatabaseBrowserUI(siteConfig: any): string {
        const dbType = siteConfig.database || "mysql";
        const host = siteConfig.databaseHost || "localhost";
        // MariaDB and MySQL use same port 3306, SQLite doesn't use a port
        const port =
            siteConfig.databasePort ||
            (dbType === "mysql" || dbType === "mariadb" ? 3306 : 0);
        const dbName = siteConfig.databaseName || "wordpress";
        const user = siteConfig.databaseUser || "root";

        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Browser - ${siteConfig.siteName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #1e1e1e;
      color: #e0e0e0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #2d2d2d;
      padding: 15px 20px;
      border-bottom: 1px solid #404040;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
    }
    .db-info {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #888;
    }
    .db-info span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .container {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    .sidebar {
      width: 250px;
      background: #252525;
      border-right: 1px solid #404040;
      overflow-y: auto;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      background: #2d2d2d;
      padding: 10px 20px;
      border-bottom: 1px solid #404040;
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 6px 12px;
      background: #0e639c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover {
      background: #1177bb;
    }
    .btn-secondary {
      background: #3e3e3e;
    }
    .btn-secondary:hover {
      background: #4e4e4e;
    }
    .content-area {
      flex: 1;
      padding: 20px;
      overflow: auto;
    }
    .table-list {
      list-style: none;
    }
    .table-list li {
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 1px solid #2d2d2d;
    }
    .table-list li:hover {
      background: #2d2d2d;
    }
    .table-list li.active {
      background: #0e639c;
      color: white;
    }
    .table-container {
      background: #2d2d2d;
      border-radius: 6px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #404040;
    }
    th {
      background: #333;
      font-weight: 600;
      font-size: 13px;
      color: #fff;
    }
    td {
      font-size: 13px;
    }
    .query-editor {
      background: #2d2d2d;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
    }
    textarea {
      width: 100%;
      min-height: 120px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 4px;
      color: #e0e0e0;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      resize: vertical;
    }
    .status {
      padding: 10px 15px;
      background: #2d2d2d;
      border-radius: 4px;
      margin-top: 10px;
      font-size: 12px;
    }
    .success {
      background: #0d4d2f;
      color: #7dff7d;
    }
    .error {
      background: #5a1515;
      color: #ff7d7d;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    .empty {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .connection-info {
      background: #2d2d2d;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .connection-info h3 {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .connection-info p {
      font-size: 12px;
      color: #888;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗄️ Database Browser - ${siteConfig.siteName}</h1>
    <div class="db-info">
      <span>📊 ${dbType.toUpperCase()}</span>
      <span>🖥️ ${host}:${port}</span>
      <span>📁 ${dbName}</span>
    </div>
  </div>

  <div class="container">
    <div class="sidebar">
      <ul class="table-list" id="tableList">
        <li class="loading">Loading tables...</li>
      </ul>
    </div>

    <div class="main-content">
      <div class="toolbar">
        <button class="btn" onclick="refreshTables()">🔄 Refresh</button>
        <button class="btn btn-secondary" onclick="showQueryEditor()">📝 SQL Query</button>
        <button class="btn btn-secondary" onclick="exportDatabase()">💾 Export</button>
      </div>

      <div class="content-area" id="contentArea">
        <div class="connection-info">
          <h3>Connection Information</h3>
          <p><strong>Database Type:</strong> ${dbType}</p>
          <p><strong>Host:</strong> ${host}</p>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Database:</strong> ${dbName}</p>
          <p><strong>User:</strong> ${user}</p>
        </div>
        
        <div class="empty">
          <h3>Welcome to Database Browser</h3>
          <p>Select a table from the sidebar to view its contents</p>
          <p>or click "SQL Query" to execute custom queries</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const dbConfig = ${JSON.stringify({
        type: dbType,
        host,
        port,
        database: dbName,
        user,
    })};

    let currentTable = null;

    async function loadTables() {
      try {
        const response = await window.electron.invoke('database:get-tables', '${siteConfig.siteName}');
        const tableList = document.getElementById('tableList');
        
        if (response && response.length > 0) {
          tableList.innerHTML = response.map(table => 
            \`<li onclick="selectTable('\${table.name}')">\${table.name}</li>\`
          ).join('');
        } else {
          tableList.innerHTML = '<li class="empty">No tables found</li>';
        }
      } catch (error) {
        document.getElementById('tableList').innerHTML = 
          \`<li class="error">Error: \${error.message}</li>\`;
      }
    }

    async function selectTable(tableName) {
      currentTable = tableName;
      
      // Update active state
      document.querySelectorAll('.table-list li').forEach(li => li.classList.remove('active'));
      event.target.classList.add('active');

      const contentArea = document.getElementById('contentArea');
      contentArea.innerHTML = '<div class="loading">Loading table data...</div>';

      try {
        const [schema, data, count] = await Promise.all([
          window.electron.invoke('database:get-schema', '${siteConfig.siteName}', tableName),
          window.electron.invoke('database:get-table-data', '${siteConfig.siteName}', tableName, 1, 100),
          window.electron.invoke('database:get-row-count', '${siteConfig.siteName}', tableName)
        ]);

        renderTableView(tableName, schema, data, count);
      } catch (error) {
        contentArea.innerHTML = \`<div class="error">Error loading table: \${error.message}</div>\`;
      }
    }

    function renderTableView(tableName, schema, data, count) {
      const contentArea = document.getElementById('contentArea');
      
      let html = \`
        <h2 style="margin-bottom: 15px;">Table: \${tableName} (\${count} rows)</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>\${schema.map(col => \`<th>\${col.name}</th>\`).join('')}</tr>
            </thead>
            <tbody>
      \`;

      if (data.rows && data.rows.length > 0) {
        data.rows.forEach(row => {
          html += '<tr>';
          schema.forEach(col => {
            const value = row[col.name];
            const displayValue = value === null ? '<em>NULL</em>' : String(value).substring(0, 100);
            html += \`<td>\${displayValue}</td>\`;
          });
          html += '</tr>';
        });
      } else {
        html += \`<tr><td colspan="\${schema.length}" style="text-align: center; color: #666;">No data</td></tr>\`;
      }

      html += \`
            </tbody>
          </table>
        </div>
      \`;

      contentArea.innerHTML = html;
    }

    function showQueryEditor() {
      const contentArea = document.getElementById('contentArea');
      contentArea.innerHTML = \`
        <div class="query-editor">
          <h3 style="margin-bottom: 10px;">SQL Query Editor</h3>
          <textarea id="sqlQuery" placeholder="Enter your SQL query here..."></textarea>
          <div style="margin-top: 10px;">
            <button class="btn" onclick="executeQuery()">▶️ Execute Query</button>
          </div>
          <div id="queryResult"></div>
        </div>
      \`;
    }

    async function executeQuery() {
      const query = document.getElementById('sqlQuery').value.trim();
      if (!query) return;

      const resultDiv = document.getElementById('queryResult');
      resultDiv.innerHTML = '<div class="loading">Executing query...</div>';

      try {
        const result = await window.electron.invoke('database:execute-raw', '${siteConfig.siteName}', query);
        
        if (result.success) {
          if (result.result.rows && result.result.rows.length > 0) {
            renderQueryResult(result.result);
          } else {
            resultDiv.innerHTML = '<div class="success">Query executed successfully. Rows affected: ' + (result.result.changes || 0) + '</div>';
          }
        } else {
          resultDiv.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
      }
    }

    function renderQueryResult(result) {
      const resultDiv = document.getElementById('queryResult');
      
      let html = '<div class="table-container" style="margin-top: 15px;"><table><thead><tr>';
      result.columns.forEach(col => {
        html += \`<th>\${col}</th>\`;
      });
      html += '</tr></thead><tbody>';

      result.rows.forEach(row => {
        html += '<tr>';
        result.columns.forEach(col => {
          const value = row[col];
          const displayValue = value === null ? '<em>NULL</em>' : String(value);
          html += \`<td>\${displayValue}</td>\`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      html += \`<div class="status success">Query returned \${result.rows.length} rows in \${result.executionTime}ms</div>\`;
      
      resultDiv.innerHTML = html;
    }

    function refreshTables() {
      loadTables();
      document.getElementById('contentArea').innerHTML = '<div class="empty"><h3>Tables refreshed</h3><p>Select a table to view its contents</p></div>';
    }

    async function exportDatabase() {
      try {
        const result = await window.electron.invoke('database:export', '${siteConfig.siteName}', 'export.sql');
        alert(result.success ? 'Database exported successfully!' : 'Export failed: ' + result.error);
      } catch (error) {
        alert('Export failed: ' + error.message);
      }
    }

    // Load tables on page load
    loadTables();
  </script>
</body>
</html>
    `;
    }

    /**
     * Open browser window
     */
    private openBrowserWindow(): void {
        if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            this.browserWindow.focus();
            return;
        }

        this.browserWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false,
            },
            title: "Database Browser",
            backgroundColor: "#1e1e1e",
        });

        this.browserWindow.loadURL(`http://127.0.0.1:${this.port}`);

        this.browserWindow.on("closed", () => {
            this.browserWindow = null;
            this.stopServer();
        });
    }

    /**
     * Stop HTTP server
     */
    private stopServer(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            logger.info("Database browser server stopped");
        }
    }

    /**
     * Close database browser
     */
    closeDatabaseBrowser(): void {
        if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            this.browserWindow.close();
        }
        this.stopServer();
    }
}

export const databaseBrowserService = new DatabaseBrowserService();
