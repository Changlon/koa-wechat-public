"use strict";
// 微信服务器接口
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    accessTokenApi: '%scgi-bin/token?grant_type=client_credential&appid=%s&secret=%s',
    createMenu: '%scgi-bin/menu/create?access_token=%s',
    accessUserInfo: '%scgi-bin/user/info?access_token=%s&openid=%s&lang=zh_CN',
    accessMessage: '%scgi-bin/message/custom/send?access_token=%s',
    uploadTmpFile: '%scgi-bin/media/upload?access_token=%s&type=%s',
    uploadFile: '%scgi-bin/material/add_material?access_token=%s&type=%s',
    removeFile: '%scgi-bin/material/del_material?access_token=%s'
};
