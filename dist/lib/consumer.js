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
exports.Consumer = void 0;
const util_1 = __importDefault(require("util"));
const axios_1 = __importDefault(require("axios"));
class Consumer {
    constructor(app) {
        this.app = app;
        this.bindToThis();
    }
    bindToThis() {
        const bindMethodList = [
            'getUserDetail'
        ];
        bindMethodList.forEach(mName => {
            this[mName] = this[mName].bind(this);
        });
    }
    getUserDetail(openid) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.app.getAccessToken();
            if (!token)
                throw new Error(`Consumer -- getUserDetail:access_token获取失败${token}`);
            const url = util_1.default.format(this.app.apiUrl.accessUserInfo, this.app.apiDomain, token, openid);
            const res = yield axios_1.default.get(url);
            return res ? res.status === 200 ? res.data : res : undefined;
        });
    }
}
exports.Consumer = Consumer;
