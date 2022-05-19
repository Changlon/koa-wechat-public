"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const util_1 = __importDefault(require("util"));
const crypto_1 = __importDefault(require("crypto"));
const accept_1 = __importDefault(require("./accept"));
const wetchat_common_api_1 = __importDefault(require("./wetchat-common-api"));
const cryptoGraphyUtil_1 = __importDefault(require("../utils/cryptoGraphyUtil"));
const send_1 = __importDefault(require("./send"));
const material_1 = require("./material");
const consumer_1 = require("./consumer");
class WetchatPublic {
    constructor(config) {
        if (config) {
            this.init(config);
        }
    }
    init(config) {
        if (!config.appId || !config.appSecret || !config.token) {
            throw new Error(`请保证 appId,appSecret,token参数的正确传入:${config.appId},${config.appSecret},${config.token}`);
        }
        this.config = config;
        this.token = config.token;
        this.appId = config.appId;
        this.appSecret = config.appSecret;
        this.apiDomain = config.apiDomain || 'https://api.weixin.qq.com/';
        this.apiUrl = Object.assign(Object.assign({}, config.apiUrl), wetchat_common_api_1.default);
        this.crypto = new cryptoGraphyUtil_1.default({
            token: config.token,
            appId: config.appId,
            encodingAESKey: config.encodingAESKey
        });
        this.stack = [];
        this.msgIdQueque = new Map();
        this.accessTokenCache = {
            access_token: '',
            expires_time: 0
        };
        this.encodingAESKey = config.encodingAESKey;
        this.miniConfig = config.miniConfig;
        this.send = new send_1.default(this, null, null);
        this.material = new material_1.Material(this);
        this.consumer = new consumer_1.Consumer(this);
    }
    start() {
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.request;
            let method = req.method;
            method = method.toLowerCase();
            switch (method) {
                case 'get':
                    yield this.auth()(ctx, next);
                    break;
                case 'post':
                    yield this.handle()(ctx, next);
                    break;
            }
        });
    }
    auth() {
        return (ctx) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.request;
            const { signature, timestamp, nonce, echostr, code, state } = req.query;
            if (!code) {
                const array = [this.token, timestamp, nonce];
                array.sort();
                const tempStr = array.join('');
                const hashCode = crypto_1.default.createHash('sha1');
                const resultCode = hashCode.update(tempStr, 'utf8').digest('hex');
                resultCode === signature ? ctx.body = echostr : ctx.body = 'mismatch';
                return this.menuHandler ? yield Promise.resolve(this.menuHandler()) : undefined;
            }
            // 处理网页授权认证
            yield this.handleWebPageOauth(code, state, ctx);
        });
    }
    handleWebPageOauth(code, state, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const appId = this.appId;
            const secret = this.appSecret;
            const authuRL = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`;
            const resData = yield axios_1.default.get(authuRL);
            const data = resData.status === 200 ? resData.data : undefined;
            if (!data)
                throw new Error(`用户获取token失败！${resData.data.errcode} : ${resData.data.errmsg}`);
            data.state = state;
            return this.oauthHandler ? yield Promise.resolve(this.oauthHandler(data, ctx)) : ctx.body = "no oauthHandler";
        });
    }
    // eslint-disable-next-line camelcase
    oauth(handler) {
        return (this.oauthHandler = handler) && this;
    }
    handle() {
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const req = ctx.request;
            let xml;
            if (req.query.encrypt_type === 'aes') {
                // eslint-disable-next-line camelcase
                const { msg_signature, timestamp, nonce } = req.query;
                const decodeXml = this.crypto.init({
                    msgSignature: msg_signature,
                    timestamp,
                    nonce
                }).decryptMsg(req.body.xml.Encrypt[0]);
                Object.keys(decodeXml).forEach(key => {
                    decodeXml[key] = [decodeXml[key]];
                });
                xml = decodeXml;
            }
            else {
                xml = req.body && req.body.xml;
            }
            if (!xml) {
                throw new Error(`
               wechatApplication warn:  请使用中间件!
               示例:
               app.use(xmlParser())  
               app.use(bodyParser()) 
               app.use(wetchatApp.start()) 
            `);
            }
            const fromUserName = xml.FromUserName && xml.FromUserName[0], createtime = xml.CreateTime && xml.CreateTime[0];
            //消息排重
            if (!this.msgIdQueque.has(`${fromUserName}-${createtime}`)) {
                this.msgIdQueque.set(`${fromUserName}-${createtime}`, new Date().getTime());
                this.ctx = ctx;
                this.next = next;
                const msgType = (xml.MsgType[0]) + 'Handler';
                yield Promise.resolve(accept_1.default[msgType].call(this, xml));
            }
            //清理key
            const keyIter = this.msgIdQueque.keys();
            let k_ = keyIter.next();
            while (!k_.done) {
                if ((new Date().getTime() - this.msgIdQueque.get(k_.value))
                    > (1000 * 15)) {
                    this.msgIdQueque.delete(k_.value);
                }
                k_ = keyIter.next();
            }
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = new Date().getTime();
            const url = util_1.default.format(this.apiUrl.accessTokenApi, this.apiDomain, this.appId, this.appSecret);
            if (this.accessTokenCache.access_token &&
                this.accessTokenCache.expires_time &&
                this.accessTokenCache.expires_time > currentTime) {
                return this.accessTokenCache.access_token;
            }
            const resStatus = yield axios_1.default.get(url);
            if (resStatus.status === 200) {
                const data = resStatus.data;
                if (!data)
                    throw new Error(`koa-wechat-public getAccessToken (err) :  请检查公众号appid,secret 配置 !`);
                this.accessTokenCache.access_token = data.access_token;
                this.accessTokenCache.expires_time = new Date().getTime() + (parseInt(data.expires_in) - 200) * 1000;
                return data.access_token;
            }
            else {
                throw new Error(`koa-wechat-public getAccessToken (err) :  请求异常请检查是否配置公众号白ip白名单 ：${resStatus}`);
            }
        });
    }
    createMenu(menuViews) {
        const menuHandler = () => __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getAccessToken();
            if (!token)
                throw new Error(`WechatApplication - createMenu : access_token is invalid ${token}`);
            const url = util_1.default.format(this.apiUrl.createMenu, this.apiDomain, token);
            const res = yield axios_1.default.post(url, JSON.stringify(menuViews));
            if (res.data.errcode !== 0)
                throw Error(`createMenu failed! Possible caused by : ${res.data.errmsg}`);
            return res.data;
        });
        this.menuHandler = menuHandler;
        return this;
    }
    text(content, userHandler) {
        const patternType = Object.prototype.toString.call(content);
        const textContext = {
            type: 0 /* TEXT */,
            handlers: [userHandler],
            pattern: content
        };
        if (patternType === '[object String]') {
            textContext.patternType = "string" /* STRING */;
            for (let i = 0; i < this.stack.length; ++i) {
                const context = this.stack[i];
                if (context.type === 0 /* TEXT */ && content === context.pattern) {
                    context.handlers.push(userHandler);
                    return this;
                }
            }
            this.stack.push(textContext);
            return this;
        }
        else if (patternType === '[object RegExp]') {
            textContext.patternType = "regexp" /* REGEXP */;
            this.stack.push(textContext);
            return this;
        }
        else {
            throw new Error('参数错误: text(content:string|RegExp,...) content 传入的应该是一个字符串或正则匹配表达式!');
        }
    }
    image(hander) {
        const imageContext = {
            type: 1 /* IMAGE */,
            handlers: [hander]
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 1 /* IMAGE */) {
                context.handlers.push(hander);
                return this;
            }
        }
        this.stack.push(imageContext);
        return this;
    }
    video(handler) {
        const videoContext = {
            type: 3 /* VIDEO */,
            handlers: [handler]
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 3 /* VIDEO */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(videoContext);
        return this;
    }
    voice(handler) {
        const voiceContext = {
            type: 2 /* VOICE */,
            handlers: [handler]
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 2 /* VOICE */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(voiceContext);
        return this;
    }
    subscribe(handler) {
        const subscribeContext = {
            type: 4 /* EVENT */,
            handlers: [handler],
            eventType: 0 /* SUBSCRIBE */
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 4 /* EVENT */ && context.eventType === 0 /* SUBSCRIBE */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(subscribeContext);
        return this;
    }
    unsubscribe(handler) {
        const unsubscribContext = {
            type: 4 /* EVENT */,
            handlers: [handler],
            eventType: 1 /* UNSUBSCRIBE */
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 4 /* EVENT */ && context.eventType === 1 /* UNSUBSCRIBE */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(unsubscribContext);
        return this;
    }
    scan(handler) {
        const scanContext = {
            type: 4 /* EVENT */,
            handlers: [handler],
            eventType: 2 /* SCAN */
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 4 /* EVENT */ && context.eventType === 2 /* SCAN */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(scanContext);
        return this;
    }
    menu(handler) {
        const menuContext = {
            type: 4 /* EVENT */,
            handlers: [handler],
            eventType: 3 /* MENU */
        };
        for (let i = 0; i < this.stack.length; ++i) {
            const context = this.stack[i];
            if (context.type === 4 /* EVENT */ && context.eventType === 3 /* MENU */) {
                context.handlers.push(handler);
                return this;
            }
        }
        this.stack.push(menuContext);
        return this;
    }
}
exports.default = WetchatPublic;
