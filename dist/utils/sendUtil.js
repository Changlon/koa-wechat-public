"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SendUtil {
    /** 创建返回文本的xml数据 */
    createTxtMsg(toUser, fromUser, content) {
        return `<xml>
        <ToUserName><![CDATA[${fromUser}]]></ToUserName>
        <FromUserName><![CDATA[${toUser}]]></FromUserName>
        <CreateTime>${new Date().getTime()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${content}]]></Content>
      </xml>`;
    }
    /** 创建图片返回的xml数据 */
    createImageMsg(toUser, fromUser, mediaId) {
        return `<xml>
        <ToUserName><![CDATA[${fromUser}]]></ToUserName>
        <FromUserName><![CDATA[${toUser}]]></FromUserName>
        <CreateTime>${new Date().getTime()}</CreateTime>
        <MsgType><![CDATA[image]]></MsgType>
        <Image>
          <MediaId><![CDATA[${mediaId}]]></MediaId>
        </Image>
      </xml>`;
    }
    /** 创建视屏返回xml数据 */
    createVideoMsg(toUser, fromUser, mediaId, title, desc) {
        return `<xml>
      <ToUserName><![CDATA[${fromUser}]]></ToUserName>
      <FromUserName><![CDATA[${toUser}]]></FromUserName>
      <CreateTime>12345678</CreateTime>
      <MsgType><![CDATA[video]]></MsgType>
      <Video>
        <MediaId><![CDATA[${mediaId}]]></MediaId>
        <Title><![CDATA[${title || 'title'}]]></Title>
        <Description><![CDATA[${desc || 'description'}]]></Description>
      </Video>
    </xml>`;
    }
}
exports.default = SendUtil;
