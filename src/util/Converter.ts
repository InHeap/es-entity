import * as sql from '../sql';
import * as types from '../types';

interface IOption {
	ignoreKeys?: (string | number | symbol)[],
	allowKeys?: (string | number | symbol)[],
	dateFunc?: (src: any) => Date
}

class Converter {

	option: IOption = null;

	constructor(option?: IOption) {
		this.option = option || {};
		this.option.ignoreKeys = option.ignoreKeys || [];
	}

	convert<T extends Object>(res: T, ...srcs: any[]) {
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
			}).forEach((key: string) => {
				if (res[key] instanceof types.Date) {
					let d: Date = null;
					if (this.option.dateFunc) {
						d = this.option.dateFunc(src[key]);
					} else if (src[key] instanceof Date) {
						d = src[key];
					}
					res[key].set(d);
				} else {
					res[key].set(src[key]);
				}
			});
		});
		return res;
	}

	reverse<T extends Object>(res: T, ...srcs: any[]) {
		let allowKeys = this.option.allowKeys || Object.keys(res);
		allowKeys = allowKeys.filter(key => {
			return !this.option.ignoreKeys.includes(key);
		});

		srcs.forEach(src => {
			Object.keys(src).filter((key) => {
				return allowKeys.includes(key)
					&& src[key] instanceof sql.Field
					&& res[key] != src[key].get();
			}).forEach((key: string) => {
				res[key] = src[key].get();
			});
		});
		return res;
	}

}

export default Converter;
