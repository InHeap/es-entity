"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("../sql");
const types = require("../types");
class Converter {
    constructor(option) {
        this.option = null;
        this.option = option || {};
        this.option.ignoreKeys = option.ignoreKeys || [];
    }
    convert(res, ...srcs) {
        let allowKeys = this.option.allowKeys || Object.keys(res);
        allowKeys = allowKeys.filter(key => {
            return !this.option.ignoreKeys.includes(key);
        });
        srcs.forEach(src => {
            Object.keys(src).filter((key) => {
                return allowKeys.includes(key)
                    && src[key] != null
                    && res[key] instanceof sql.Field
                    && res[key].get() != src[key];
            }).forEach((key) => {
                if (res[key] instanceof types.Date) {
                    let d = null;
                    if (this.option.dateFunc) {
                        d = this.option.dateFunc(src[key]);
                    }
                    else if (src[key] instanceof Date) {
                        d = src[key];
                    }
                    res[key].set(d);
                }
                else {
                    res[key].set(src[key]);
                }
            });
        });
        return res;
    }
    reverse(res, ...srcs) {
        let allowKeys = this.option.allowKeys || Object.keys(res);
        allowKeys = allowKeys.filter(key => {
            return !this.option.ignoreKeys.includes(key);
        });
        srcs.forEach(src => {
            Object.keys(src).filter((key) => {
                return allowKeys.includes(key)
                    && src[key] instanceof sql.Field
                    && res[key] != src[key].get();
            }).forEach((key) => {
                res[key] = src[key].get();
            });
        });
        return res;
    }
}
exports.default = Converter;
//# sourceMappingURL=Converter.js.map