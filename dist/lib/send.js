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
const sendUtil_1 = __importDefault(require("../utils/sendUtil"));
/**
 * 发送消息模块
 */
class Send {
    constructor(ctx, fromUser, toUser) {
        this.app = ctx;
        this.ctx = this.app.ctx;
        this.sendUtil = new sendUtil_1.default();
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.bindToThis();
    }
    bindToThis() {
        const bindMethodList = [
            'sendTxtMsg',
            'sendImageMsg',
            'sendVideoMsg',
            'pushTxtCustomerMsg',
            'pushImageCustomerMsg',
            'pushVideoCustomerMsg',
            'pushMiniProgramCardMsg',
            'pushTemplateMsg'
        ];
        bindMethodList.forEach(mName => {
            this[mName] = this[mName].bind(this);
        });
    }
    send(xml) {
        xml = this.app.ctx.request.query.encrypt_type === 'aes' ? this.app.crypto.encryptMsg(xml) : xml;
        this.ctx.type = 'application/xml';
        this.ctx.body = xml;
        return false;
    }
    push(res) {
        return res ? res.status === 200 ? res.data : res : undefined;
    }
    sendTxtMsg(content) {
        const xml = this.sendUtil.createTxtMsg(this.toUser, this.fromUser, content);
        return this.send(xml);
    }
    sendImageMsg(mediaId) {
        const xml = this.sendUtil.createImageMsg(this.toUser, this.fromUser, mediaId);
        return this.send(xml);
    }
    sendVideoMsg(mediaId, title, desc) {
        const xml = this.sendUtil.createVideoMsg(this.toUser, this.fromUser, mediaId, title, desc);
        return this.send(xml);
    }
    pushTxtCustomerMsg(toUser, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const $data = '{"touser":"' + toUser + '","msgtype":"text","text":{"content":"' + content + '"}}';
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Send -- pushTxtCustomerMsg:access_token获取失败${token}`);
            const url = util_1.default.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token);
            const res = yield axios_1.default.post(url, $data);
            return this.push(res);
        });
    }
    pushImageCustomerMsg(toUser, mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const $data = '{"touser":"' + toUser + '","msgtype":"image","image":{"media_id":"' + mediaId + '"}}';
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Send -- pushImageCustomerMsg:access_token获取失败${token}`);
            const url = util_1.default.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token);
            const res = yield axios_1.default.post(url, $data);
            return this.push(res);
        });
    }
    pushVideoCustomerMsg(toUser, mediaId, thumbMediaId, title, desc) {
        return __awaiter(this, void 0, void 0, function* () {
            const $data = '{"touser":"' + toUser + '","msgtype":"video","video":{"media_id":"' + mediaId + '","thumb_media_id":"' + (thumbMediaId || mediaId) + '","title":"' + (title || "title") + '","description":"' + (desc || "desc") + '"}}';
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Send -- pushVideoCustomerMsg:access_token获取失败${token}`);
            const url = util_1.default.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token);
            const res = yield axios_1.default.post(url, $data);
            return this.push(res);
        });
    }
    pushMiniProgramCardMsg(toUser, miniConfig, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = miniConfig || this.app.miniConfig;
            let paramStr = config.pagePath[config.pagePath.length - 1] === "?" ? "" : "?";
            if (params) {
                Object.keys(params).forEach(key => {
                    paramStr = paramStr + `${key}=${params[key]}&`;
                });
                paramStr = paramStr.substring(0, paramStr.length - 1);
            }
            if (!config)
                throw new Error(`Send -- pushMiniProgramCardMsg: 小程序配置信息缺失 --config ${config}`);
            const $data = `{"touser":"${toUser}","msgtype":"miniprogrampage","miniprogrampage":{"title":"${config.title}","appid":"${config.appId}","pagepath":"${config.pagePath}${paramStr}","thumb_media_id":"${config.thumbMediaId || config.mediaId}"}}`;
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Send -- pushMiniProgramCardMsg:access_token获取失败${token}`);
            const url = util_1.default.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token);
            const res = yield axios_1.default.post(url, $data);
            return this.push(res);
        });
    }
    pushTemplateMsg(toUser, templateId, data, url, miniprogram, topcolor) {
        return __awaiter(this, void 0, void 0, function* () {
            const miniConfig = this.app.miniConfig;
            const defaultMiniProgram = miniConfig ? { appid: miniConfig.appId, pagepath: miniConfig.pagePath } : undefined;
            const $data = `{"touser":"${toUser}","template_id":"${templateId}","url":"${url || ""}","miniprogram":${miniprogram ? JSON.stringify(miniprogram) : defaultMiniProgram ? JSON.stringify(defaultMiniProgram) : JSON.stringify({})},"topcolor":"${topcolor || "#ff0000"}","data":${JSON.stringify(data)}}`;
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Send -- pushTemplateMsg access_token获取失败 ${token}`);
            const url_ = util_1.default.format(this.app.apiUrl.template, this.app.apiDomain, token);
            const res = yield axios_1.default.post(url_, $data);
            return this.push(res);
        });
    }
}
exports.default = Send;
