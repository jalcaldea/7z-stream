
var MyBuffer = function (buffer) {

    this._buffer = buffer;
    this._pointer = 0;

    this.is7zFile = function () {
        return this._buffer[0] == 0x37 && this._buffer[1] == 0x7a && this._buffer[2] == 0xbc && this._buffer[3] == 0xaf && this._buffer[4] == 0x27 && this._buffer[5] == 0x1c;
    }

    this.readUint64 = function () {
        var firstByte = this._buffer[this._pointer];
        var mask = 0x80;
        var value = 0;
        var nextByte = this._buffer[this._pointer];
        this._pointer++;
        for (var i = 0; i < 8; i++) {

            if ((firstByte & mask) == 0) {
                return value | ((firstByte & (mask - 1)) << (8 * i));
            }
            nextByte = this._buffer[this._pointer];
            this._pointer++;

            value = (value | (nextByte << (8 * i)));
            mask >>>= 1;
        }
        return value;
    }

    this.readByte = function () {
        var value = this._buffer[this._pointer];
        this._pointer += 1;

        return value;
    }

    this.read = function (bytes) {

        var toReturn = new MyBuffer(this._buffer.slice(this._pointer, this._pointer + bytes));
        this._pointer += bytes;

        return toReturn;
    }

    this.readData = function (offset, length) {
        var toReturn = new MyBuffer(this._buffer.slice(this._pointer + offset, offset + length));
        return toReturn;
    }

    this.getBuffer = function () {
        return this._buffer.slice(this._pointer, this._pointer + this._buffer.length);
    }

    this.readUIntLE = function (offset, length) {
        return this._buffer.readUIntLE(this._pointer + offset, length);
    }

    this.readUIntBE = function (offset, length) {
        return this._buffer.readUIntBE(this._pointer + offset, length);
    }

    this.readIntLE = function (offset, length) {
        return this._buffer.readIntLE(this._pointer + offset, length);
    }

    this.readBigInt64LE = function (offset) {
        return this._buffer.readBigInt64LE(this._pointer + offset);
    }

    this.readUInt32LE = function (offset) {
        return this._buffer.readUInt32LE(this._pointer + offset);
    }

}

module.exports = MyBuffer;
