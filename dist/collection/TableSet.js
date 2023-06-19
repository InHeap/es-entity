import * as sql from '../sql/index.js';
import * as model from '../model/index.js';
import IQuerySet from './IQuerySet.js';
import QuerySet from './QuerySet.js';
import DBSet from './DBSet.js';
class TableSet extends IQuerySet {
    EntityType;
    dbSet;
    constructor(EntityType) {
        super();
        this.EntityType = EntityType;
        this.dbSet = new DBSet(EntityType);
    }
    getEntityType() {
        return this.EntityType;
    }
    getEntity() {
        let obj = new this.EntityType();
        let keys = Reflect.ownKeys(obj);
        keys.forEach(key => {
            let field = Reflect.get(obj, key);
            if (field instanceof model.LinkObject || field instanceof model.LinkArray) {
                field.bind(this.context, obj);
            }
        });
        return obj;
    }
    async insert(entity) {
        let stat = new sql.Statement();
        stat.command = sql.types.Command.INSERT;
        stat.collection.value = this.dbSet.tableName;
        let fields = this.dbSet.filterFields(Reflect.ownKeys(entity));
        fields.forEach((field) => {
            let val = Reflect.get(entity, field.fieldName);
            if (val == null)
                return;
            let serializer = this.context.handler.serializeMap.get(field.columnType);
            let finalVal = serializer ? serializer(val) : val;
            let col = new sql.Collection();
            col.value = field.colName;
            stat.columns.push(col);
            let expr = new sql.Expression('?');
            expr.args.push(finalVal);
            stat.values.push(expr);
        });
        let result = await this.context.execute(stat);
        let primaryFields = this.dbSet.getPrimaryFields();
        let finalObj = null;
        if (primaryFields.length == 1) {
            let primaryField = primaryFields[0];
            let id = result.id ?? Reflect.get(entity, primaryField.fieldName);
            finalObj = await this.get(id);
        }
        else {
            let idParams = [];
            primaryFields.forEach(field => {
                idParams.push(Reflect.get(entity, field.fieldName));
            });
            finalObj = await this.get(...idParams);
        }
        if (!finalObj)
            throw new Error('Insert Object Not Found');
        return finalObj;
    }
    async insertBulk(entities) {
        let queries = entities.map(ent => {
            let stat = new sql.Statement();
            stat.command = sql.types.Command.INSERT;
            stat.collection.value = this.dbSet.tableName;
            let fields = this.dbSet.filterFields(Reflect.ownKeys(ent));
            fields.forEach((field) => {
                let val = Reflect.get(ent, field.fieldName);
                if (val == null)
                    return;
                let serializer = this.context.handler.serializeMap.get(field.columnType);
                let finalVal = serializer ? serializer(val) : val;
                let col = new sql.Collection();
                col.value = field.colName;
                stat.columns.push(col);
                let expr = new sql.Expression(finalVal);
                stat.values.push(expr);
            });
            let query = stat.eval(this.context.handler);
            return query;
        });
        let bulkQuery = queries.join('; ');
        await this.context.execute(bulkQuery);
    }
    whereExpr(entity) {
        let primaryFields = this.dbSet.getPrimaryFields();
        if (!(primaryFields?.length)) {
            throw new Error('Primary Key fields not found');
        }
        let eb = new model.WhereExprBuilder(this.dbSet.fieldMap);
        let expr = new sql.Expression();
        primaryFields.forEach((pri, idx) => {
            let temp = Reflect.get(entity, pri.fieldName);
            expr = expr.add(eb.eq(pri.fieldName, temp));
        });
        return expr;
    }
    async update(entity, ...updatedKeys) {
        let stat = new sql.Statement();
        stat.command = sql.types.Command.UPDATE;
        stat.collection.value = this.dbSet.tableName;
        let primaryFields = this.dbSet.getPrimaryFields();
        let fields = this.dbSet.filterFields(Reflect.ownKeys(entity)).filter(field => !primaryFields.some(pri => pri.fieldName == field.fieldName));
        if (updatedKeys)
            fields = fields.filter(field => updatedKeys.includes(field.fieldName));
        fields.forEach((field) => {
            let c1 = new sql.Expression(field.colName);
            let c2 = new sql.Expression('?');
            let val = Reflect.get(entity, field.fieldName);
            let serializer = this.context.handler.serializeMap.get(field.columnType);
            let finalVal = serializer ? serializer(val) : val;
            c2.args.push(finalVal);
            let expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
            stat.columns.push(expr);
        });
        stat.where = this.whereExpr(entity);
        if (stat.columns.length > 0) {
            let result = await this.context.execute(stat);
            if (result.error) {
                throw new Error(result.error);
            }
            else {
                let idParams = [];
                primaryFields.forEach(field => {
                    idParams.push(Reflect.get(entity, field.fieldName));
                });
                let finalObj = await this.get(...idParams);
                if (!finalObj)
                    throw new Error('Update Object Not Found');
                return finalObj;
            }
        }
        else {
            return entity;
        }
    }
    async updateBulk(entities, ...updatedKeys) {
        let primaryFields = this.dbSet.getPrimaryFields();
        let temp = new this.EntityType();
        let fields = this.dbSet.filterFields(Reflect.ownKeys(temp)).filter(field => !primaryFields.some(pri => pri.fieldName == field.fieldName));
        if (updatedKeys)
            fields = fields.filter(field => updatedKeys.includes(field.fieldName));
        let queries = entities.map(ent => {
            let stat = new sql.Statement();
            stat.command = sql.types.Command.UPDATE;
            stat.collection.value = this.dbSet.tableName;
            fields.forEach((field) => {
                let c1 = new sql.Expression(field.colName);
                let val = Reflect.get(ent, field.fieldName);
                let serializer = this.context.handler.serializeMap.get(field.columnType);
                let finalVal = serializer ? serializer(val) : val;
                let c2 = new sql.Expression(finalVal);
                let expr = new sql.Expression(null, sql.types.Operator.Equal, c1, c2);
                stat.columns.push(expr);
            });
            stat.where = this.whereExpr(ent);
            let query = stat.eval(this.context.handler);
            return query;
        });
        let bulkQuery = queries.join('; ');
        await this.context.execute(bulkQuery);
    }
    async insertOrUpdate(entity) {
        let primaryFields = this.dbSet.getPrimaryFields();
        let idParams = [];
        primaryFields.forEach(field => {
            idParams.push(Reflect.get(entity, field.fieldName));
        });
        let obj = await this.get(...idParams);
        if (obj) {
            return this.update(entity);
        }
        else {
            return this.insert(entity);
        }
    }
    async delete(entity) {
        let stat = new sql.Statement();
        stat.command = sql.types.Command.DELETE;
        stat.collection.value = this.dbSet.tableName;
        stat.where = this.whereExpr(entity);
        await this.context.execute(stat);
    }
    async get(...idParams) {
        if (idParams == null)
            throw new Error('Id parameter cannot be null');
        let primaryFields = this.dbSet.getPrimaryFields();
        if (primaryFields.length == 0) {
            throw new Error(`No Primary Field Found in Table: ${this.dbSet.tableName}`);
        }
        else if (primaryFields.length != idParams.length) {
            throw new Error('Invalid Arguments Length');
        }
        else {
            return this.where(a => {
                let expr = new sql.Expression();
                primaryFields.forEach((pri, idx) => {
                    expr = expr.add(a.eq(pri.fieldName, idParams[idx]));
                });
                return expr;
            }).single();
        }
    }
    async getOrThrow(...idParams) {
        let val = await this.get(idParams);
        if (!val)
            throw new Error('Value Not Found');
        return val;
    }
    where(param, ...args) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.where(param, args);
    }
    groupBy(func) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.groupBy(func);
    }
    orderBy(func) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.orderBy(func);
    }
    limit(size, index) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.limit(size, index);
    }
    list() {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.list();
    }
    select(TargetType) {
        let q = new QuerySet(this.context, this.dbSet, TargetType);
        return q.select(TargetType);
    }
    selectPlain(keys) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.selectPlain(keys);
    }
    join(coll, param, joinType) {
        let q = new QuerySet(this.context, this.dbSet, this.EntityType);
        return q.join(coll, param, joinType);
    }
}
export default TableSet;
//# sourceMappingURL=TableSet.js.map