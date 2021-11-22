"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const xml2js_1 = __importDefault(require("xml2js"));
const buildXML = new xml2js_1.default.Builder({ rootName: 'xml', cdata: true, headless: true, renderOpts: { indent: ' ', pretty: true } });
class CryptoGraphy {
    constructor(config) {
        this.aesModel = 'aes-256-cbc';
        if (config) {
            this.token = config.token;
            this.appId = config.appId;
            this.encodingAESKey = config.encodingAESKey ? Buffer.from(`${config.encodingAESKey}=`, 'base64') : undefined;
            this.iv = this.encodingAESKey ? this.encodingAESKey.slice(0, 16) : undefined;
        }
    }
    KCS7Encoder(textLength) {
        // eslint-disable-next-line camelcase
        const block_size = 32;
        // eslint-disable-next-line camelcase
        let amount_to_pad = block_size - (textLength % block_size);
        // eslint-disable-next-line camelcase
        if (amount_to_pad === 0) {
            // eslint-disable-next-line camelcase
            amount_to_pad = block_size;
        }
        const pad = String.fromCharCode(amount_to_pad);
        const s = [];
        // eslint-disable-next-line camelcase
        for (let i = 0; i < amount_to_pad; i++)
            s.push(pad);
        return s.join('');
    }
    encryptMsg(xmlMsg) {
        const random = crypto_1.default.randomBytes(8).toString('hex');
        const text = Buffer.from(xmlMsg);
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(text.length);
        const pack = this.KCS7Encoder(20 + text.length + this.appId.length);
        const content = random + buf.toString('binary') + text.toString('binary') + this.appId + pack;
        const cipheriv = crypto_1.default.createCipheriv(this.aesModel, this.encodingAESKey, this.iv);
        cipheriv.setAutoPadding(false);
        const encryptedMsg = Buffer.concat([cipheriv.update(content, 'binary'), cipheriv.final()]).toString('base64');
        const msgSignature = this.getMsgSignature(encryptedMsg);
        return buildXML.buildObject({
            Encrypt: encryptedMsg,
            MsgSignature: msgSignature,
            TimeStamp: this.timestamp,
            Nonce: this.nonce
        });
    }
    init(config) {
        this.token = config.token ? config.token : this.token;
        this.appId = config.appId ? config.appId : this.appId;
        this.encodingAESKey = config.encodingAESKey ? Buffer.from(`${config.encodingAESKey}=`, 'base64') : this.encodingAESKey;
        this.iv = config.encodingAESKey ? this.encodingAESKey.slice(0, 16) : this.iv;
        this.msgSignature = config.msgSignature;
        this.timestamp = config.timestamp;
        this.nonce = config.nonce;
        return this;
    }
    decryptMsg(encryptMsg) {
        const tempSignature = this.getMsgSignature(encryptMsg);
        if (this.msgSignature !== tempSignature) {
            throw new Error('msgSignature is not invalid');
        }
        const deCipheriv = crypto_1.default.createDecipheriv(this.aesModel, this.encodingAESKey, this.iv);
        deCipheriv.setAutoPadding(false);
        let deEncryptedMsg = Buffer.concat([deCipheriv.update(encryptMsg, 'base64'), deCipheriv.final()]).toString('utf8');
        const pad = deEncryptedMsg.charCodeAt(deEncryptedMsg.length - 1);
        deEncryptedMsg = deEncryptedMsg.slice(20, -pad).replace(/<\/xml>.*/, '</xml>');
        return this.parseXmlToJSON(deEncryptedMsg);
    }
    parseXmlToJSON(xml) {
        if (!xml || typeof xml !== 'string')
            return {};
        const re = {};
        xml = xml.replace(/^<xml>|<\/xml>$/g, '');
        const ms = xml.match(/<([a-z0-9]+)>([\s\S]*?)<\/\1>/ig);
        if (ms && ms.length > 0) {
            ms.forEach(t => {
                const ms = t.match(/<([a-z0-9]+)>([\s\S]*?)<\/\1>/i);
                const tagName = ms[1];
                let cdata = ms[2] || '';
                // eslint-disable-next-line no-useless-escape
                cdata = cdata.replace(/^\s*<\!\[CDATA\[\s*|\s*\]\]>\s*$/g, '');
                re[tagName] = cdata;
            });
        }
        return re;
    }
    getMsgSignature(encryptMsg) {
        const tempStr = [this.token, this.timestamp, this.nonce, encryptMsg].sort().join('');
        const hashCode = crypto_1.default.createHash('sha1');
        const resultCode = hashCode.update(tempStr, 'utf8').digest('hex');
        return resultCode;
    }
}
exports.default = CryptoGraphy;
