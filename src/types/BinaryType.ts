import Field from '../sql/Field.js';
import * as bean from '../bean/index.js';

class BinaryType extends Field<Buffer> {

	constructor(data?: Buffer) {
		super();
		this.set(data);
	}

	set(value: Buffer) {
		if (value == null || value == undefined) {
			super.set(null);
		} else if (value instanceof Buffer) {
			super.set(value);
		} else {
			throw new bean.SqlException('Invalid Buffer Value');
		}
	}

}

export default BinaryType;
