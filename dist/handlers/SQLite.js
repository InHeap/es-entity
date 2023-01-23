import * as bean from '../bean/index.js';
import Handler from './Handler.js';
export default class SQlite extends Handler {
    handlerName = 'sqlite';
    driver = null;
    connectionPool = null;
    constructor(config) {
        super(config);
    }
    async init() {
        this.driver = this.config.driver ?? (await import('sqlite3'));
        this.connectionPool = new this.driver.Database(this.config.database);
    }
    async getConnection() {
        return this.connectionPool;
    }
    async initTransaction(conn) { await conn.query('BEGIN TRANSACTION'); }
    async commit(conn) { await conn.query('COMMIT'); }
    async rollback(conn) { await conn.query('ROLLBACK'); }
    async close(conn) { await conn.end(); }
    async end() { }
    async getTableInfo(tableName) {
        let r = await this.run(`pragma table_info('${tableName}')`);
        let result = new Array();
        r.rows.forEach((row) => {
            let col = new bean.ColumnInfo();
            col.field = row['name'];
            let columnType = row['type'].toLowerCase();
            if (columnType.includes('integer')
                || columnType.includes('real')
                || columnType.includes('numeric')) {
                col.type = bean.ColumnType.NUMBER;
            }
            else if (columnType.includes('text')) {
                col.type = bean.ColumnType.STRING;
            }
            else if (columnType.includes('blob')) {
                col.type = bean.ColumnType.BINARY;
            }
            col.nullable = row['notnull'] == 0 ? true : false;
            col.primaryKey = row['pk'] == 1 ? true : false;
            col.default = row['dflt_value'];
            result.push(col);
        });
        return result;
    }
    async run(query, args, connection) {
        let queryObj = this.prepareQuery(query, args);
        let temp = null;
        let conn;
        if (connection && connection instanceof bean.Connection && connection.Handler.handlerName == this.handlerName && connection.conn) {
            conn = connection.conn;
        }
        else {
            conn = this.connectionPool;
        }
        temp = await new Promise((resolve, reject) => {
            conn.run(queryObj.query, queryObj.args, function (err, r) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(r);
                }
            });
        });
        let result = new bean.ResultSet();
        if (temp.insertId)
            result.id = temp.insertId;
        if (temp.changedRows) {
            result.rowCount = temp.changedRows;
        }
        else if (Array.isArray(temp)) {
            result.rows = temp;
            result.rowCount = temp.length;
        }
        return result;
    }
}
//# sourceMappingURL=SQLite.js.map