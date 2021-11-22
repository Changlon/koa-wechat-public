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
exports.Material = void 0;
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
class Material {
    constructor(ctx) {
        this.app = ctx;
        this.bindToThis();
    }
    bindToThis() {
        const bindMethodList = [
            'addTmpMaterial',
            'addLongTimeMaterial',
            'removeLongTimeMaterial'
        ];
        bindMethodList.forEach(mName => {
            this[mName] = this[mName].bind(this);
        });
    }
    getFormLength(formData) {
        return new Promise((resolve, reject) => {
            formData.getLength((err, len) => {
                if (err)
                    reject(err);
                resolve(len);
            });
        });
    }
    addTmpMaterial(localPath, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.app;
            const apiUrl = app.apiUrl;
            const accessToken = yield app.getAccessToken();
            const url = util_1.default.format(apiUrl.uploadTmpFile, app.apiDomain, accessToken, type);
            if (!accessToken)
                throw new Error(`Material -- addTmpMaterial:access_token获取失败${accessToken}`);
            // eslint-disable-next-line new-cap
            const form = new form_data_1.default();
            form.append('file', fs_1.default.createReadStream(localPath));
            const headers = form.getHeaders();
            const len = yield this.getFormLength(form);
            headers['content-length'] = len || 0;
            return (yield axios_1.default.post(url, form, { headers })).data;
        });
    }
    addLongTimeMaterial(localPath, type, desc) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.app;
            const apiUrl = app.apiUrl;
            const accessToken = yield app.getAccessToken();
            const url = util_1.default.format(apiUrl.uploadFile, app.apiDomain, accessToken, type);
            if (!accessToken)
                throw new Error(`Material -- addLongTimeMaterial:access_token获取失败${accessToken}`);
            // eslint-disable-next-line new-cap
            const form = new form_data_1.default();
            switch (type) {
                case 'image':
                    form.append('media', fs_1.default.createReadStream(localPath));
                    break;
                case 'video':
                    form.append('media', fs_1.default.createReadStream(localPath));
                    form.append('description', JSON.stringify({
                        title: (desc && desc.title) || 'video_title',
                        introduction: (desc && desc.desc) || 'video_introduction'
                    }));
                    break;
            }
            // form.append("media",fs.createReadStream(localPath))
            const headers = form.getHeaders();
            const len = yield this.getFormLength(form);
            headers['content-length'] = len || 0;
            return (yield axios_1.default.post(url, form, { headers })).data;
        });
    }
    removeLongTimeMaterial(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.app;
            const apiUrl = app.apiUrl;
            const $data = `{"media_id":"${mediaId}"}`;
            const accessToken = yield app.getAccessToken();
            if (!accessToken)
                throw new Error(`Material -- removeLongTimeMaterial:access_token获取失败${accessToken}`);
            const url = util_1.default.format(apiUrl.removeFile, app.apiDomain, accessToken);
            return (yield axios_1.default.post(url, $data)).data;
        });
    }
}
exports.Material = Material;
