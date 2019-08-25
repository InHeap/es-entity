"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bean = require("../bean");
const Handler_1 = require("../lib/Handler");
const sql = require("../lib/sql");
const Connection_1 = require("../lib/Connection");
class Oracle extends Handler_1.default {
    constructor(config) {
        super();
        this.handlerName = 'oracle';
        this.connectionPool = null;
        this.driver = null;
        this.config = config;
    }
    async init() {
        this.driver = this.config.driver || await Promise.resolve().then(() => require('oracledb'));
        this.connectionPool = await this.driver.createPool({
            user: this.config.username,
            password: this.config.password,
            connectString: `${this.config.host}:${this.config.port}/${this.config.database}`
        });
    }
    async getConnection() {
        let conn = await this.driver.getConnection({
            user: this.config.username,
            password: this.config.password,
            connectString: `${this.config.host}:${this.config.port}/${this.config.database}`
        });
        return new Connection_1.default(this, conn);
    }
    async openConnetion(conn) { return null; }
    async initTransaction(conn) { return null; }
    async commit(conn) { return conn.conn.commit(); }
    async rollback(conn) { return conn.conn.rollback(); }
    async close(conn) { return conn.conn.close(); }
    async end() { return null; }
    async getTableInfo(tableName) {
        let r = await this.run('describe ' + tableName);
        let result = new Array();
        r.rows.forEach((row) => {
            let col = new bean.ColumnInfo();
            col.field = row['Field'];
            let columnType = row['Type'].toLowerCase();
            if (columnType.includes('tinyint(1)')) {
                col.type = bean.ColumnType.BOOLEAN;
            }
            else if (columnType.includes('int')
                || columnType.includes('float')
                || columnType.includes('double')
                || columnType.includes('decimal')) {
                col.type = bean.ColumnType.NUMBER;
            }
            else if (columnType.includes('varchar')
                || columnType.includes('text')) {
                col.type = bean.ColumnType.STRING;
            }
            else if (columnType.includes('timestamp')) {
                col.type = bean.ColumnType.DATE;
            }
            else if (columnType.includes('json')) {
                col.type = bean.ColumnType.JSON;
            }
            col.nullable = row['IS_NULL'] == 'YES' ? true : false;
            col.primaryKey = row['Key'].indexOf('PRI') >= 0 ? true : false;
            col.default = row['Default'];
            col.extra = row['Extra'];
            result.push(col);
        });
        return result;
    }
    async run(query, args, connection) {
        let q = null;
        if (typeof query === 'string') {
            q = query;
        }
        else if (query instanceof sql.Statement) {
            q = query.eval(this);
            args = query.args;
        }
        this.context.log('query:' + q);
        let result = new bean.ResultSet();
        let res = null;
        if (connection && connection instanceof Connection_1.default && connection.Handler.handlerName == this.handlerName && connection.conn) {
            res = await connection.conn.execute(q, args);
        }
        else {
            let conn = null;
            try {
                conn = await this.connectionPool.getConnection();
                res = await conn.execute(q, args);
            }
            catch (err) {
                this.context.log(err);
            }
            finally {
                if (conn) {
                    try {
                        await conn.close();
                    }
                    catch (err) {
                        this.context.log(err);
                    }
                }
            }
        }
        if (res.insertId)
            result.id = res.insertId;
        if (res.changedRows) {
            result.rowCount = res.changedRows;
        }
        else if (Array.isArray(res)) {
            result.rows = res;
            result.rowCount = res.length;
        }
        return result;
    }
}
exports.default = Oracle;
