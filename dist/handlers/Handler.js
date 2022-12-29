import * as sql from '../sql/index.js';
export default class Handler {
    context = null;
    config;
    async getTableInfo(tableName) { return null; }
    async run(query, args, connetction) { return null; }
    convertPlaceHolder(query) {
        return query;
    }
    prepareQuery(queryStmt, args) {
        let query = null;
        if (typeof queryStmt === 'string') {
            query = queryStmt;
        }
        else if (queryStmt instanceof sql.Statement) {
            query = queryStmt.eval(this);
            args = queryStmt.args;
        }
        return {
            query, args
        };
    }
    eq(val0, val1) {
        return `${val0} = ${val1}`;
    }
    neq(val0, val1) {
        return `${val0} != ${val1}`;
    }
    lt(val0, val1) {
        return `${val0} < ${val1}`;
    }
    gt(val0, val1) {
        return `${val0} > ${val1}`;
    }
    lteq(val0, val1) {
        return `${val0} <= ${val1}`;
    }
    gteq(val0, val1) {
        return `${val0} >= ${val1}`;
    }
    and(values) {
        return values.filter(x => x).map(val => {
            return `(${val})`;
        }).join(' and ');
    }
    or(values) {
        return values.filter(x => x).map(val => {
            return `(${val})`;
        }).join(' or ');
    }
    not(val0) {
        return ` not ${val0}`;
    }
    in(values) {
        let lhs = values[0];
        let rhs = values.slice(1).join(', ');
        return `${lhs} in (${rhs})`;
    }
    between(values) {
        return `${values[0]} between ${values[1]} and ${values[2]}`;
    }
    like(val0, val1) {
        return `${val0} like ${val1}`;
    }
    isNull(val0) {
        return `${val0} is null`;
    }
    isNotNull(val0) {
        return `${val0} is not null`;
    }
    exists(val0) {
        return ` exists (${val0})`;
    }
    limit(size, index) {
        let indexStr = index ? `${index}, ` : '';
        return ` limit ${indexStr}${size}`;
    }
    plus(val0, val1) {
        return `${val0} + ${val1}`;
    }
    minus(val0, val1) {
        return `${val0} - ${val1}`;
    }
    multiply(val0, val1) {
        return `${val0} * ${val1}`;
    }
    devide(val0, val1) {
        return `${val0} / ${val1}`;
    }
    asc(val0) {
        return `${val0} asc`;
    }
    desc(val0) {
        return `${val0} desc`;
    }
    sum(val0) {
        return `sum(${val0})`;
    }
    min(val0) {
        return `min(${val0})`;
    }
    max(val0) {
        return `max(${val0})`;
    }
    count(val0) {
        return `count(${val0})`;
    }
    average(val0) {
        return `avg(${val0})`;
    }
}
