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
const send_1 = __importDefault(require("./send"));
const material_1 = require("./material");
const wechat_1 = __importDefault(require("./wechat"));
const consumer_1 = require("./consumer");
// eslint-disable-next-line no-redeclare
function excuteHandler(context, acceptContext, handlers, cur) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cur === handlers.length)
            return 'ok';
        try {
            const val = yield Promise.resolve(handlers[cur].call(context, acceptContext));
            return val ? yield excuteHandler(context, acceptContext, handlers, ++cur) : 'break';
        }
        catch (e) {
            throw new Error(`用户编写的程序出错:${e}`);
        }
    });
}
/** 菜单事件类型判断 */
const MenuEventReg = /view_miniprogram|CLICK|VIEW/;
// eslint-disable-next-line no-redeclare
function getBaseApplicationContext(xml) {
    if (!(this instanceof wechat_1.default)) {
        throw new Error('getBaseApplicationContext:调用错误! 示例: getBaseApplicationContext.call(ctx:WechatApplication,xml:{[key:string]:any})');
    }
    const context = this;
    const toUser = xml.ToUserName[0];
    const fromUser = xml.FromUserName[0];
    const msgId = xml.MsgId ? xml.MsgId[0] : '';
    const createTime = xml.CreateTime ? parseInt(xml.CreateTime[0]) : 0;
    const send = new send_1.default(context, fromUser, toUser);
    const material = new material_1.Material(context);
    const consumer = new consumer_1.Consumer(context);
    context.send = send;
    context.material = material;
    context.consumer = consumer;
    return {
        context,
        msgId,
        toUser,
        fromUser,
        createTime,
        send,
        material,
        consumer
    };
}
exports.default = {
    /** 事件处理解析 */
    eventHandler(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this;
            const baseAcceptContext = getBaseApplicationContext.call(context, xml);
            const msgType = "event" /* EVENT */;
            const eventKey = xml.EventKey ? xml.EventKey[0] : '';
            const ticket = xml.Ticket ? xml.Ticket[0] : '';
            const menuId = xml.MenuId ? xml.MenuId[0] : '';
            const event = xml.Event[0];
            const acceptEventContext = Object.assign(Object.assign({}, baseAcceptContext), { scene: eventKey && ticket ? "scan" /* SCAN */ : "normal" /* NORMAL */, event,
                eventKey,
                ticket,
                menuId,
                msgType });
            let subscribeHandlers = [];
            let unsubscribeHandlers = [];
            let scanHandlers = [];
            let menuHandler = [];
            for (let i = 0; i < context.stack.length; ++i) {
                const stackContext = context.stack[i];
                if (stackContext.type === "event" /* EVENT */) {
                    if (stackContext.eventType === 0 /* SUBSCRIBE */) {
                        subscribeHandlers = subscribeHandlers.concat(stackContext.handlers);
                    }
                    else if (stackContext.eventType === 1 /* UNSUBSCRIBE */) {
                        unsubscribeHandlers = unsubscribeHandlers.concat(stackContext.handlers);
                    }
                    else if (stackContext.eventType === 2 /* SCAN */) {
                        scanHandlers = scanHandlers.concat(stackContext.handlers);
                    }
                    else if (stackContext.eventType === 3 /* MENU */) {
                        menuHandler = menuHandler.concat(stackContext.handlers);
                    }
                }
            }
            switch (event) {
                case 'subscribe':
                    yield excuteHandler(context, acceptEventContext, subscribeHandlers, 0);
                    break;
                case 'unsubscribe':
                    yield excuteHandler(context, acceptEventContext, unsubscribeHandlers, 0);
                    break;
                case 'SCAN':
                    yield excuteHandler(context, acceptEventContext, scanHandlers, 0);
                    break;
                default:
                    MenuEventReg.test(event) && (yield excuteHandler(context, acceptEventContext, menuHandler, 0));
                    break;
            }
        });
    },
    /** 文本处理解析函数 */
    textHandler(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this;
            const baseAcceptContext = getBaseApplicationContext.call(context, xml);
            const acceptCommonContext = Object.assign(Object.assign({}, baseAcceptContext), { msgType: "text" /* TEXT */, content: xml.Content[0] });
            let matchedRegExp = [];
            for (let i = 0; i < context.stack.length; ++i) {
                const stackContext = this.stack[i];
                if (stackContext.type === "text" /* TEXT */) {
                    const match = acceptCommonContext.content.match(stackContext.pattern);
                    if (stackContext.patternType === "string" /* STRING */ && match && match.length) {
                        return yield excuteHandler(context, acceptCommonContext, stackContext.handlers, 0);
                    }
                    else if (stackContext.patternType === "regexp" /* REGEXP */ && match && match.length) {
                        matchedRegExp = matchedRegExp.concat(stackContext.handlers);
                    }
                }
            }
            yield excuteHandler(context, acceptCommonContext, matchedRegExp, 0);
        });
    },
    /** 图片处理解析函数 */
    imageHandler(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this;
            const baseAcceptContext = getBaseApplicationContext.call(context, xml);
            const acceptCommonContext = Object.assign(Object.assign({}, baseAcceptContext), { msgType: "image" /* IMAGE */, picUrl: xml.PicUrl[0], mediaId: xml.MediaId[0] });
            let matchedPics = [];
            context.stack.forEach((stackContext) => {
                if (stackContext.type === "image" /* IMAGE */) {
                    matchedPics = matchedPics.concat(stackContext.handlers);
                }
            });
            yield excuteHandler(context, acceptCommonContext, matchedPics, 0);
        });
    },
    /** 视频处理解析函数 */
    videoHandler(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this;
            const baseAcceptContext = getBaseApplicationContext.call(context, xml);
            const acceptCommonContext = Object.assign(Object.assign({}, baseAcceptContext), { msgType: "video" /* VIDEO */, mediaId: xml.MediaId[0], thumbMediaId: xml.ThumbMediaId[0] });
            let matchedVideos = [];
            context.stack.forEach((stackContext) => {
                if (stackContext.type === "video" /* VIDEO */) {
                    matchedVideos = matchedVideos.concat(stackContext.handlers);
                }
            });
            yield excuteHandler(context, acceptCommonContext, matchedVideos, 0);
        });
    },
    /** 语音处理解析函数 */
    voiceHandler(xml) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = this;
            const baseAcceptContext = getBaseApplicationContext.call(context, xml);
            const acceptCommonContext = Object.assign(Object.assign({}, baseAcceptContext), { msgType: "voice" /* VOICE */, mediaId: xml.MediaId[0], format: xml.Format[0] });
            let matchedVoices = [];
            context.stack.forEach((stackContext) => {
                if (stackContext.type === "voice" /* VOICE */) {
                    matchedVoices = matchedVoices.concat(stackContext.handlers);
                }
            });
            yield excuteHandler(context, acceptCommonContext, matchedVoices, 0);
        });
    }
};
