"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("../sql/Expression");
class NumberType extends sql.Field {
    constructor(data) {
        super();
        this._value = data;
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                else if (prop in target._value) {
                    return target._value[prop];
                }
            },
            getPrototypeOf() {
                return sql.Field.prototype;
            }
        });
    }
    set(value) {
        if (value == null || value == undefined) {
            super.set(null);
        }
        else if (typeof value == 'number' || value instanceof Number) {
            super.set(value);
        }
    }
}
exports.default = NumberType;
//# sourceMappingURL=NumberType.js.map