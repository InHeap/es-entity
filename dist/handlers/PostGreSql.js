"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bean = require("../bean/index");
const Handler_1 = require("../lib/Handler");
const sql = require("../lib/sql");
const Connection_1 = require("../lib/Connection");
class PostgreSql extends Handler_1.default {
    constructor(config) {
        super();
        this.driver = null;
        this.handlerName = 'postgresql';
        this.connectionPool = null;
        this.config = config;
    }
    async init() {
        this.driver = this.config.driver || await Promise.resolve().then(() => require('pg'));
        this.connectionPool = new this.driver.Pool({
            user: this.config.username,
            password: this.config.password,
            database: this.config.database,
            host: this.config.host,
            port: this.config.port,
            max: this.config.connectionLimit
        });
    }
    async getConnection() {
        let conn = new this.driver.Client({
            host: this.config.host,
            port: this.config.port,
            user: this.config.username,
            password: this.config.password,
            database: this.config.database
        });
        return this.openConnetion(conn);
    }
    async openConnetion(conn) {
        try {
            await conn.connect();
            this.context.log('Connection Creation Failed');
            return new Connection_1.default(this, conn);
        }
        catch (err) {
            throw err;
        }
    }
    async initTransaction(conn) { await conn.query('BEGIN'); }
    async commit(conn) { await conn.query('COMMIT'); }
    async rollback(conn) { await conn.query('ROLLBACK'); }
    async close(conn) { conn.end(); }
    async end() { return null; }
    async getTableInfo(tableName) {
        let descQuery = `select f.ordinal_position, f.column_name, f.data_type, f.is_nullable, f.column_default,
		case when (select count(1) from pg_constraint p where p.conrelid = c.oid and f.ordinal_position = any(p.conkey) and p.contype   = 'p') > 0 then true else false end as primarykey
	from information_schema.columns f
		join pg_class c on c.relname = f.table_name
	where f.table_name = '${tableName}'`;
        let tableInfo = await this.run(descQuery);
        let result = new Array();
        tableInfo.rows.forEach((row) => {
            let col = new bean.ColumnInfo();
            col.field = row['column_name'];
            let columnType = row['data_type'].toLowerCase();
            if (columnType.includes('boolean')) {
                col.type = bean.ColumnType.BOOLEAN;
            }
            else if (columnType.includes('int') ||
                columnType.includes('float') ||
                columnType.includes('double') ||
                columnType.includes('decimal') ||
                columnType.includes('real') ||
                columnType.includes('numeric')) {
                col.type = bean.ColumnType.NUMBER;
            }
            else if (columnType.includes('varchar') ||
                columnType.includes('text') ||
                columnType.includes('character varying') ||
                columnType.includes('uuid')) {
                col.type = bean.ColumnType.STRING;
            }
            else if (columnType.includes('timestamp') || columnType.includes('date')) {
                col.type = bean.ColumnType.DATE;
            }
            col.nullable = !row['is_nullable'];
            col.primaryKey = row['primarykey'];
            col.default = row['column_default'];
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
            args = (query.args == undefined ? [] : query.args);
        }
        this.context.log('query:' + q);
        let result = new bean.ResultSet();
        let con = null;
        if (connection && connection instanceof Connection_1.default && connection.Handler.handlerName == this.handlerName && connection.conn) {
            con = connection.conn;
        }
        else {
            con = this.connectionPool;
        }
        let p = new Promise((resolve, reject) => {
            con.query(q, args, (err, response) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(response);
                }
            });
        });
        let r = await p;
        if (r.rowCount)
            result.rowCount = r.rowCount;
        if (Array.isArray(r.rows))
            result.rows = r.rows.slice();
        if (Array.isArray(r.rows) && r.rows.length > 0)
            result.id = r.rows[0].id;
        return result;
    }
    convertPlaceHolder(query) {
        for (let i = 1; query.includes('?'); i++) {
            query = query.replace('?', '$' + i);
        }
        return query;
    }
    insertQuery(collection, columns, values) {
        return super.insertQuery(collection, columns, values) + ' returning id';
    }
    limit(val0, val1) { return ' limit ' + val0 + (val1 ? ' OFFSET ' + val1 : ''); }
}
exports.default = PostgreSql;
//# sourceMappingURL=PostGreSql.js.map