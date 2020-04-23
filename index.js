var MyBuffer = require("./lib/7z-buffer.js");
var MyFile = require("./lib/7z-file.js");

var lzma = require('lzma-purejs');

/* TODO 
var kComment = 0x16;
var kStartPos = 0x18;
*/

var Sevenzip = function (buffer) {

    this._cons = {
        kEnd: 0x00,
        kHeader: 0x01,
        kArchiveProperties: 0x02,
        kAdditionalStreamsInfo: 0x03,
        kMainStreamsInfo: 0x04,
        kFilesInfo: 0x05,
        kPackInfo: 0x06,
        kUnPackInfo: 0x07,
        kSubStreamsInfo: 0x08,
        kSize: 0x09,
        kName: 0x11,
        kCTime: 0x12,
        kATime: 0x13,
        kMTime: 0x14,
        kWinAttributes: 0x15,
        kCRC: 0x0A,
        kFolder: 0x0B,
        kCodersUnPackSize: 0x0C,
        kNumUnPackStream: 0x0D,
        kEmptyStream: 0x0E,
        kEmptyFile: 0x0F,
        kAnti: 0x10,
        kEncodedHeader: 0x17,
        kDummy: 0x19,
    }

    this._is7zFile = true;
    this.header_length = 32;
    this._buffer = new MyBuffer(buffer);
    this._files = [];

    this.readData = function (offset, size) {
        return this._buffer.readData(offset, size);
    }

    this.getVersion = function () {
        return this._version;
    }

    this.is7zFile = function () {
        return this._is7zFile;
    }

    this.getFiles = function () {
        return this._files;
    }

    this._parseFilesInfo = function () {

        var numFiles = this._parsed_buffer.readUint64();

        var files = [];

        for (var i = 0; i < numFiles; i++) {
            files[i] = {
                name: "",
            };
        }
        var propertyType = this._parsed_buffer.readByte();

        while (propertyType != 0x00) {

            var size = this._parsed_buffer.readUint64();

            switch (propertyType) {
                case this._cons.kEmptyStream:

                    var data = this._parsed_buffer.read(size).getBuffer();

                    var bitarr = [];

                    for (var i = 0; i < data.length; i++) {

                        var aux = data[i].toString(2);
                        aux = ('00000000' + aux).substring(aux.length);
                        for (var j = 0; j < 8; j++) {
                            var value = (aux[j]) ? (aux[j] != 0) : false;

                            bitarr[j + 8 * (i)] = value;
                        }
                    }
                    for (var i = 0; i < files.length; i++) {    // Pone los bits al reves
                        files[i].isEmptyStream = bitarr[i];
                    }


                    break;

                case this._cons.kEmptyFile:

                    var data = this._parsed_buffer.read(size).getBuffer();

                    var bitarr = [];

                    for (var i = 0; i < data.length; i++) {

                        var aux = data[i].toString(2);
                        aux = ('00000000' + aux).substring(aux.length);
                        for (var j = 0; j < 8; j++) {
                            var value = (aux[j]) ? (aux[j] != 0) : false;

                            bitarr[j + 8 * (i)] = value;
                        }
                    }
                    var count = 0;
                    for (var i = 0; i < files.length; i++) {    // Pone los bits al reves
                    
                        if (files[i].isEmptyStream) {
                            files[i].isEmptyFile = bitarr[count];
                            count++;
                        } else {
                            files[i].isEmptyFile = false;
                        }

                    }

                    break;

                case this._cons.kAntiFile:
                    var data = this._parsed_buffer.read(size).getBuffer();

                    var bitarr = [];

                    for (var i = 0; i < data.length; i++) {

                        var aux = data[i].toString(2);
                        aux = ('00000000' + aux).substring(aux.length);
                        for (var j = 0; j < 8; j++) {
                            var value = (aux[j]) ? (aux[j] != 0) : false;

                            bitarr[j + 8 * (i)] = value;
                        }
                    }
                    var count = 0;

                    for (var i = 0; i < files.length; i++) {    // Pone los bits al reves
                    
                        if (files[i].isEmptyStream) {
                            files[i].isAntiFile = bitarr[count];
                            count++;
                        } else {
                            files[i].isAntiFile = false;
                        }

                    }

                    break;

                case this._cons.kName:

                    var external = this._parsed_buffer.readByte();

                    if (external != 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    } else {
                        if ((size % 2) == 0) { // Si no es impar el nombre no vale
                            throw new Error("File names length invalid");
                        }

                        var names = this._parsed_buffer.read(size - 1).getBuffer().toString("hex").split("0000");

                        for (var j = 0; j < names.length && names[j] != "00"; j++) {

                            var aux = names[j].replace(/00/g, ""); // quitamos los ceros sobrantes         
                            var name = new Buffer(aux, 'hex').toString();   // Generamos el buffer y lo transformamos a string
                            files[j].name = name;   // Se lo asignamos al archivo

                        }
                    }

                    break;
                case this._cons.kCTime:

                    var alldefined = this._parsed_buffer.readByte();

                    if (alldefined == 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    }

                    var external = this._parsed_buffer.readByte();

                    if (external != 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    } else {
                        for (var j = 0; j < files.length; j++) {
                            var time = this._parsed_buffer.read(8).readBigInt64LE(0);

                            time /= 10000n;
                            time = Number(time);

                            var date = new Date(time);
                            date.setYear((date.getFullYear() - 369))
                            date.setDate(date.getDate() + 1);

                            files[j].created_time = date;
                        }
                    }

                    break;
                case this._cons.kATime:

                    var alldefined = this._parsed_buffer.readByte();

                    if (alldefined == 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    }

                    var external = this._parsed_buffer.readByte();

                    if (external != 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    } else {
                        for (var j = 0; j < files.length; j++) {
                            var time = this._parsed_buffer.read(8).readBigInt64LE(0);

                            time /= 10000n;
                            time = Number(time);

                            var date = new Date(time);
                            date.setYear((date.getFullYear() - 369))
                            date.setDate(date.getDate() + 1);

                            files[j].added_time = date;
                        }
                    }

                    break;
                case this._cons.kMTime:

                    var alldefined = this._parsed_buffer.readByte();

                    if (alldefined == 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    }

                    var external = this._parsed_buffer.readByte();

                    if (external != 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    } else {
                        for (var j = 0; j < files.length; j++) {
                            var time = this._parsed_buffer.read(8).readBigInt64LE(0);

                            time /= 10000n;
                            time = Number(time);

                            var date = new Date(time);
                            date.setYear((date.getFullYear() - 369))
                            date.setDate(date.getDate() + 1);

                            files[j].modified_time = date;
                        }
                    }

                    break;
                case this._cons.kWinAttributes:

                    var alldefined = this._parsed_buffer.readByte();

                    if (alldefined == 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    }

                    var external = this._parsed_buffer.readByte();

                    if (external != 0x00) {
                        //TODO   
                        throw new Error("Not implemented yet.");
                    } else {
                        for (var j = 0; j < files.length; j++) {
                            var atributes = this._parsed_buffer.read(4).readUInt32LE(0);

                            files[j].atributes = atributes;

                        }
                    }

                    break;
                case this._cons.kDummy:
                    this._parsed_buffer.read(size);
                    break;
            }

            propertyType = this._parsed_buffer.readByte();


        }

        return files;
    }

    this._parseDigest = function (num) {

        var digest = [];

        var alldefined = this._parsed_buffer.readByte();

        if (alldefined == 0x00) {
            throw new Error("Not implemented yet.");
        } else {
            for (var i = 0; i < num; i++) {
                digest[i] = this._parsed_buffer.read(4).getBuffer();
            }
        }

        return digest;

    }

    this._parseSubStream = function (stream) {

        var num = (stream.UnPackInfo.CRC) ? stream.UnPackInfo.NumFolders - stream.UnPackInfo.CRC.length : stream.UnPackInfo.NumFolders;

        var substream = {};

        var substream_property = this._parsed_buffer.readByte();

        if (substream_property == this._cons.kNumUnPackStream) {

            var NumUnPackStream = [];

            for (var i = 0; i < num; i++) {
                NumUnPackStream[i] = this._parsed_buffer.readUint64();
            }
            substream.NumUnPackStream = NumUnPackStream;

            substream_property = this._parsed_buffer.readByte();
        }

        if (substream_property == this._cons.kSize) {

            var size = [];
            var sum = 0;
            for (var i = 0; i < substream.NumUnPackStream - 1; i++) {
                size[i] = this._parsed_buffer.readUint64();
                sum += size[i];
            }

            size[substream.NumUnPackStream - 1] = stream.UnPackInfo.folders[0].UnPackSize[0] - sum;
            substream.size = size;
            num = size.length;      //TODO no siempre es el tamaño
            
            substream_property = this._parsed_buffer.readByte();
        }

        if (substream_property == this._cons.kCRC) {
            substream.CRC = this._parseDigest(num);

            substream_property = this._parsed_buffer.readByte();
        }

        if (substream_property == this._cons.kEnd) {
            return substream;
        } else {
            throw new Error("ERROR Parsing substream Info");
        }

    }

    this._parseFolder = function () {

        var folder = {
            totalInputStreams: 0,
            totalOutputStreams: 0,
            coders: [],
        };

        var NumCoders = this._parsed_buffer.readUint64();

        for (var i = 0; i < NumCoders; i++) {

            var magicbyte = this._parsed_buffer.readByte();

            var idSize = (magicbyte & 0xf);

            var isComplex = ((magicbyte & 0x10) != 0);
            var hasAtributes = ((magicbyte & 0x20) != 0);
            var moreAlternativeMethods = ((magicbyte & 0x80) != 0);

            var coder = {
                decompressionMethodId: this._parsed_buffer.read(idSize).getBuffer(),
                NumInStreams: 1,
                NumOutStreams: 1,
            }

            if (isComplex) {
                coder.NumInStreams = this._parsed_buffer.readUint64();  // 3
                coder.NumOutStreams = this._parsed_buffer.readUint64(); // 1
            }

            folder.totalInputStreams += coder.NumInStreams;
            folder.totalOutputStreams += coder.NumOutStreams;

            if (hasAtributes) {
                var property_size = this._parsed_buffer.readUint64();
                coder.properties = this._parsed_buffer.read(property_size).getBuffer();
            }

            folder.coders[i] = coder;

        }

        var NumBindPairs = folder.totalOutputStreams - 1; // 0

        folder.bindPairs = [];
        for (var k = 0; k < NumBindPairs; k++) {
            folder.bindPairs[k] = {
                inIndex: this._parsed_buffer.readUint64(),
                outIndex: this._parsed_buffer.readUint64(),
            }
        }

        var NumPackedStreams = folder.totalInputStreams - NumBindPairs;

        folder.packedStreams = [];

        if (NumPackedStreams == 1) {
            var last = 0;
            var found = true;
            for (var i = 0; i < folder.totalInputStreams && found; i++) {

                found = false;
                for (var j = 0; j < folder.bindPairs.length && !found; j++) {
                    found = (folder.bindPairs[j].inIndex == i);
                }

                if (!found) {
                    last = i;
                }
            }

            folder.packedStreams[0] = last;
        } else {
            for (var i = 0; i < NumPackedStreams; i++) {
                folder.packedStreams[i] = this._parsed_buffer.readUint64();
            }
        }
        return folder;

    }

    this._parseUnPackInfo = function () {

        var unpack = {

            CRC: false,
        };

        var folder = this._parsed_buffer.readByte();

        if (folder == this._cons.kFolder) { // Comprueba que es carpeta

            unpack.NumFolders = this._parsed_buffer.readUint64();

            unpack.External = this._parsed_buffer.readByte();

            switch (unpack.External) {
                case 0:
                    unpack.folders = []
                    for (var i = 0; i < unpack.NumFolders; i++) {
                        unpack.folders[i] = this._parseFolder();
                    }
                    break;
                case 1:
                    unpack.DataStreamIndex = this._parsed_buffer.readUint64();
            }

            var unpacksize = this._parsed_buffer.readByte();

            if (unpacksize == this._cons.kCodersUnPackSize) {

                for (var i = 0; i < unpack.folders.length; i++) {
                    unpack.folders[i].UnPackSize = [];

                    for (var j = 0; j < unpack.folders[i].totalOutputStreams; j++) {
                        unpack.folders[i].UnPackSize[j] = this._parsed_buffer.readUint64();
                    }

                }

                var next = this._parsed_buffer.readByte();

                if (next == this._cons.kCRC) {
                    unpack.CRC = this._parseDigest(unpack.NumFolders);

                    next = this._parsed_buffer.readByte();
                }

                if (next == this._cons.kEnd) {
                    return unpack;
                } else {
                    throw new Error("ERROR Parsing UnPack Info");
                }

            } else {
                throw new Error("ERROR Parsing UnPack Info: No ksize 0x0c found!");
            }
        } else {
            throw new Error("ERROR Parsing UnPack Info: No folder 0x0b found!");
        }
    }


    this._parsePackInfo = function () {

        var packet = {
            PackPos: this._parsed_buffer.readUint64(),
            NumPackStreams: this._parsed_buffer.readUint64(),
            size: [],
            CRC: []
        }

        var pack_property = this._parsed_buffer.readByte();

        if (pack_property == this._cons.kSize) {

            for (var i = 0; i < packet.NumPackStreams; i++) {
                packet.size[i] = this._parsed_buffer.readUint64();
            }

            pack_property = this._parsed_buffer.readByte();
        }

        if (pack_property == this._cons.kCRC) {
            packet.CRC = this._parseDigest(packet.NumPackStreams);

            pack_property = this._parsed_buffer.readByte();
        }

        if (pack_property == this._cons.kEnd) {
            return packet;
        } else {
            throw new Error("ERROR Parsing Pack Info");
        }

        return packet;
    }

    this._parseStreamInfo = function () {

        var _parent = this;

        var stream = {

            getUnpackedBuffer: function (num) {

                if (stream.SubStreamInfo !== undefined && stream.SubStreamInfo.NumUnPackStream !== undefined) {

                    if (this._unpackedData === undefined) {
                        var length = (stream.PackInfo) ? stream.PackInfo.size[0] : -1;
                        var offset = (stream.PackInfo) ? stream.PackInfo.PackPos : 0 + prev_length;
                        var packetBuffer = _parent.readData(offset + _parent.header_length, length).getBuffer();
                        var folder = (stream.UnPackInfo) ? stream.UnPackInfo.folders[0] : {};


                        var decoder = function (buffer) { return buffer; };

                        if (folder.coders[0].decompressionMethodId[0] == 0x03 && folder.coders[0].decompressionMethodId[1] == 0x01 && folder.coders[0].decompressionMethodId[2] == 0x01) {
                            decoder = lzma.decompressFile;

                            packetBuffer = Buffer.concat([folder.coders[0].properties, new Buffer(8).fill(0), packetBuffer]);
                            packetBuffer.writeBigUInt64LE(BigInt(folder.UnPackSize[0]), folder.coders[0].properties.length, 8);

                        } else if (folder.coders[0].decompressionMethodId[0] == 0x21) {
                            throw new Error("LZMA2 Algorithm it's not yet implemented.");

                        } else if (folder.coders[0].decompressionMethodId[0] == 0x04 && folder.coders[0].decompressionMethodId[1] == 0x01 && folder.coders[0].decompressionMethodId[2] == 0x08) {
                            throw new Error("DEFLATE Algorithm it's not yet implemented.");
                        } else if (folder.coders[0].decompressionMethodId[0] == 0x06 && folder.coders[0].decompressionMethodId[1] == 0xf1 && folder.coders[0].decompressionMethodId[2] == 0x07 && folder.coders[0].decompressionMethodId[3] == 0x01) {
                            throw new Error("PASSWORD PROTECTED File! AES Algorithm it's not yet implemented.");

                        }

                        this._unpackedData = new MyBuffer(decoder(packetBuffer));
                    }

                    var length = (stream.SubStreamInfo) ? stream.SubStreamInfo.size[num] : -1;
                    var offset = 0;

                    for (var i = 0; i < num; i++) {
                        offset += (stream.SubStreamInfo) ? stream.SubStreamInfo.size[i] : -1;
                    }
                    return this._unpackedData.readData(offset, length).getBuffer();

                } else {

                    var length = (stream.PackInfo) ? stream.PackInfo.size[num] : -1;
                    var prev_length = 0;

                    for (var i = 0; i < num; i++) {
                        prev_length += (stream.PackInfo) ? stream.PackInfo.size[i] : -1;
                    }

                    var offset = (stream.PackInfo) ? stream.PackInfo.PackPos + prev_length : 0 + prev_length;
                    var packetBuffer = _parent.readData(offset + _parent.header_length, length).getBuffer();
                    var folder = (stream.UnPackInfo) ? stream.UnPackInfo.folders[num] : {};
                    var decoder = function (buffer) { return buffer; };

                    if (folder.coders[0].decompressionMethodId[0] == 0x03 && folder.coders[0].decompressionMethodId[1] == 0x01 && folder.coders[0].decompressionMethodId[2] == 0x01) {
                        decoder = lzma.decompressFile;

                        packetBuffer = Buffer.concat([folder.coders[0].properties, new Buffer(8).fill(0), packetBuffer]);
                        packetBuffer.writeBigUInt64LE(BigInt(folder.UnPackSize[0]), folder.coders[0].properties.length, 8);
                    } else if (folder.coders[0].decompressionMethodId[0] == 0x21) {
                        throw new Error("LZMA2 Algorithm it's not yet implemented.");
                    } else if (folder.coders[0].decompressionMethodId[0] == 0x04 && folder.coders[0].decompressionMethodId[1] == 0x01 && folder.coders[0].decompressionMethodId[2] == 0x08) {
                        throw new Error("DEFLATE Algorithm it's not yet implemented.");
                    } else if (folder.coders[0].decompressionMethodId[0] == 0x06 && folder.coders[0].decompressionMethodId[1] == 0xf1 && folder.coders[0].decompressionMethodId[2] == 0x07 && folder.coders[0].decompressionMethodId[3] == 0x01) {
                        throw new Error("PASSWORD PROTECTED File! AES Algorithm it's not yet implemented.");
                    }

                    return decoder(packetBuffer);

                }
            }

        };

        var stream_property = this._parsed_buffer.readByte();

        if (stream_property == this._cons.kPackInfo) {
            stream.PackInfo = this._parsePackInfo();

            stream_property = this._parsed_buffer.readByte();
        }

        if (stream_property == this._cons.kUnPackInfo) {
            stream.UnPackInfo = this._parseUnPackInfo();

            stream_property = this._parsed_buffer.readByte();
        }

        if (stream_property == this._cons.kSubStreamsInfo) {
            stream.SubStreamInfo = this._parseSubStream(stream);

            stream_property = this._parsed_buffer.readByte();
        }

        if (stream_property == this._cons.kEnd) {
            return stream;
        } else {
            throw new Error("ERROR Parsing Stream Info");
        }

    }

    this._parseHeader = function () {

        var header = {};

        var header_property = this._parsed_buffer.readByte();

        if (header_property == this._cons.kArchiveProperties) {
            throw new Error("Not implemented")
        }

        if (header_property == this._cons.kAdditionalStreamsInfo) {
            throw new Error("Not implemented")
        }

        if (header_property == this._cons.kMainStreamsInfo) {
            header.MainStreamInfo = this._parseStreamInfo();

            header_property = this._parsed_buffer.readByte();
        }

        if (header_property == this._cons.kFilesInfo) {
            header.FilesInfo = this._parseFilesInfo();

            header_property = this._parsed_buffer.readByte();
        }

        if (header_property == this._cons.kEnd) {

            for (var i = 0; i < header.FilesInfo.length; i++) {

                var name = header.FilesInfo[i].name;
                var data = null;
                var created_time = header.FilesInfo[i].created_time;
                var access_time = header.FilesInfo[i].access_time;
                var modified_time = header.FilesInfo[i].modified_time;

                if (!header.FilesInfo[i].isEmptyStream) {
                    data = (header.MainStreamInfo) ? header.MainStreamInfo.getUnpackedBuffer(i) : new Buffer([]);
                } else {
                    var aux = header.MainStreamInfo.SubStreamInfo;

                    if (aux.NumUnPackStream) {
                        aux.NumUnPackStream[0]++;

                        var a = aux.size.slice(i, aux.size.length);
                        var b = aux.CRC.slice(i, aux.CRC.length)

                        aux.size[i] = 0;
                        aux.CRC[i] = new Buffer(0);

                        var length = aux.size.length + 1;

                        for (var j = i + 1; j < length && a.length > 0; j++) {
                            aux.size[j] = a[j - 1 - i];
                            aux.CRC[j] = b[j - 1 - i];
                        }
                    }

                    data = new Buffer(0);
                }

                this._files.push(new MyFile(name, created_time, modified_time, access_time, data));
            }

            return header;
        } else {
            throw new Error("ERROR Parsing header Info");
        }
    }

    this._parseFile = function () {

        this._version = this.readData(6, 2);
        this._startCRCHeader = this.readData(8, 4);

        this._NextHeaderOffset = Number(this._buffer.readBigInt64LE(12));
        this._NextHeaderSize = Number(this._buffer.readBigInt64LE(20));
        this._NextHeaderCRC = this.readData(28, 4).getBuffer();

        this._parsed_buffer = this.readData(this._NextHeaderOffset + 32, this._NextHeaderSize);

        var header_Type = this._parsed_buffer.readByte();

        switch (header_Type) {

            case this._cons.kHeader:
                this._firstHeader = this._parseHeader();

                break;
            case this._cons.kEncodedHeader:
                var encoded_Header_stream = this._parseStreamInfo();

                this._parsed_buffer = new MyBuffer(encoded_Header_stream.getUnpackedBuffer(0));

                header_Type = this._parsed_buffer.readByte();
                if (header_Type == this._cons.kHeader) {
                    this._firstHeader = this._parseHeader();
                } else {
                    throw new Error("ERROR Parsing ENCODED header Info");
                }
                break;
        }

    }

    // Check if the file it's a Seven zip file
    if (this._buffer.is7zFile()) {
        this._parseFile();
    } else {
        this._is7zFile = false;
    }
}

module.exports = Sevenzip;
