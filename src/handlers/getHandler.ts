import * as bean from '../bean';
import Mysql from './Mysql.js';
import OracleHandler from './Oracle.js';
import MsSqlServer from './MsSqlServer.js';
import PostgreSql from './PostGreSql.js';
import SQLite from './SQLite.js';
import Cassandra from './Cassandra.js';
import Handler from './Handler.js';

function getHandler(config: bean.IConnectionConfig): Handler {
	let handler: Handler = null;
	switch (config.handler) {
		case bean.HandlerType.mysql:
			handler = new Mysql(config);
			break;

		case bean.HandlerType.oracle:
			handler = new OracleHandler(config);
			break;

		case bean.HandlerType.postgresql:
			handler = new PostgreSql(config);
			break;

		case bean.HandlerType.mssql:
			handler = new MsSqlServer(config);
			break;

		case bean.HandlerType.sqlite:
			handler = new SQLite(config);
			break;

		case bean.HandlerType.cassandra:
			handler = new Cassandra(config);
			break;

		default:
			throw new Error('No Handler Found');
	}
	return handler;
}

export default getHandler;
