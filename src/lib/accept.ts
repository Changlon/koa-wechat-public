
import { ApplicationCommonContext, ApplicationEventContext, EventType, MsgType, PatternType, SceneType, Stack, WechatApplication } from '../../typings'

import Send from './send'
import { Material } from './material'
import WetchatPublic from './wechat'
import { Consumer } from './consumer'

/** 异步处理 stack 的执行器 */
function excuteHandler(context:WechatApplication, acceptContext:ApplicationCommonContext|ApplicationEventContext, handlers:((ctx:ApplicationCommonContext|ApplicationEventContext)=>any)[], cur:number):Promise<any>

// eslint-disable-next-line no-redeclare
async function excuteHandler (context:WechatApplication, acceptContext:ApplicationCommonContext|ApplicationEventContext, handlers:((ctx:ApplicationCommonContext|ApplicationEventContext)=>any)[], cur:number) {
  if (cur === handlers.length) return 'ok'
  try {
    const val = await Promise.resolve(handlers[cur].call(context, acceptContext))
    return val ? await excuteHandler(context, acceptContext, handlers, ++cur) : 'break'
  } catch (e) {
    throw new Error(`用户编写的程序出错:${e}`)
  }
}

/** 菜单事件类型判断 */
const MenuEventReg = /view_miniprogram|CLICK|VIEW/

function getBaseApplicationContext(xml:any) :{
    context:WetchatPublic,
    msgId?:string,
    toUser:string,
    fromUser:string,
    createTime:number,
    send:Send,
    material:Material,
    consumer:Consumer
}

// eslint-disable-next-line no-redeclare
function getBaseApplicationContext (xml:any) {
  if (!(this instanceof WetchatPublic)) {
    throw new Error('getBaseApplicationContext:调用错误! 示例: getBaseApplicationContext.call(ctx:WechatApplication,xml:{[key:string]:any})')
  }

  const context = this
  const toUser = xml.ToUserName[0]
  const fromUser = xml.FromUserName[0]
  const msgId = xml.MsgId ? xml.MsgId[0] : ''
  const createTime = xml.CreateTime ? parseInt(xml.CreateTime[0]) : 0
  const send = new Send(context, fromUser, toUser)
  const material = new Material(context)
  const consumer = new Consumer(context)

  return {
    context,
    msgId,
    toUser,
    fromUser,
    createTime,
    send,
    material,
    consumer
  }
}

export default {

  /** 事件处理解析 */
  async eventHandler (xml:any) {
    const context = this
    const baseAcceptContext = getBaseApplicationContext.call(context, xml)
    const eventKey = xml.EventKey ? xml.EventKey[0] : ''
    const ticket = xml.Ticket ? xml.Ticket[0] : ''
    const menuId = xml.MenuId ? xml.MenuId[0] : ''
    const event = xml.Event[0]
    const acceptEventContext :ApplicationEventContext = {
      ...baseAcceptContext,
      scene: eventKey && ticket ? SceneType.SCAN : SceneType.NORMAL,
      event,
      eventKey,
      ticket,
      menuId
    }

    let subscribeHandlers = []; let unsubscribeHandlers = []; let scanHandlers = []; let menuHandler = []

    for (let i = 0; i < context.stack.length; ++i) {
      const stackContext = <Stack>context.stack[i]
      if (stackContext.type === MsgType.EVENT) {
        if (stackContext.eventType === EventType.SUBSCRIBE) {
          subscribeHandlers = subscribeHandlers.concat(stackContext.handlers)
        } else if (stackContext.eventType === EventType.UNSUBSCRIBE) {
          unsubscribeHandlers = unsubscribeHandlers.concat(stackContext.handlers)
        } else if (stackContext.eventType === EventType.SCAN) {
          scanHandlers = scanHandlers.concat(stackContext.handlers)
        } else if (stackContext.eventType === EventType.MENU) {
          menuHandler = menuHandler.concat(stackContext.handlers)
        }
      }
    }

    switch (event) {
      case 'subscribe' :
        await excuteHandler(context, acceptEventContext, subscribeHandlers, 0)
        break
      case 'unsubscribe':
        await excuteHandler(context, acceptEventContext, unsubscribeHandlers, 0)
        break
      case 'SCAN' :
        await excuteHandler(context, acceptEventContext, scanHandlers, 0)
        break
      default:
        MenuEventReg.test(event) && await excuteHandler(context, acceptEventContext, menuHandler, 0)
        break
    }
  },

  /** 文本处理解析函数 */
  async textHandler (xml:any) {
    const context = this
    const baseAcceptContext = getBaseApplicationContext.call(context, xml)
    const acceptCommonContext:ApplicationCommonContext = {
      ...baseAcceptContext,
      msgType: MsgType.TEXT,
      content: xml.Content[0]
    }

    let matchedRegExp = []

    for (let i = 0; i < context.stack.length; ++i) {
      const stackContext = this.stack[i]
      if (stackContext.type === MsgType.TEXT) {
        const match = acceptCommonContext.content.match(stackContext.pattern)
        if (stackContext.patternType === PatternType.STRING && match && match.length) {
          return await excuteHandler(context, acceptCommonContext, stackContext.handlers, 0)
        } else if (stackContext.patternType === PatternType.REGEXP && match && match.length) {
          matchedRegExp = matchedRegExp.concat(stackContext.handlers)
        }
      }
    }

    await excuteHandler(context, acceptCommonContext, matchedRegExp, 0)
  },

  /** 图片处理解析函数 */
  async imageHandler (xml:any) {
    const context = this
    const baseAcceptContext = getBaseApplicationContext.call(context, xml)
    const acceptCommonContext:ApplicationCommonContext = {
      ...baseAcceptContext,
      msgType: MsgType.IMAGE,
      picUrl: xml.PicUrl[0],
      mediaId: xml.MediaId[0]
    }
    let matchedPics = []

    context.stack.forEach((stackContext: Stack) => {
      if (stackContext.type === MsgType.IMAGE) {
        matchedPics = matchedPics.concat(stackContext.handlers)
      }
    })

    await excuteHandler(context, acceptCommonContext, matchedPics, 0)
  },

  /** 视频处理解析函数 */
  async videoHandler (xml:any) {
    const context = this
    const baseAcceptContext = getBaseApplicationContext.call(context, xml)
    const acceptCommonContext:ApplicationCommonContext = {
      ...baseAcceptContext,
      msgType: MsgType.VIDEO,
      mediaId: xml.MediaId[0],
      thumbMediaId: xml.ThumbMediaId[0]
    }

    let matchedVideos = []

    context.stack.forEach((stackContext: Stack) => {
      if (stackContext.type === MsgType.VIDEO) {
        matchedVideos = matchedVideos.concat(stackContext.handlers)
      }
    })

    await excuteHandler(context, acceptCommonContext, matchedVideos, 0)
  },

  /** 语音处理解析函数 */
  async voiceHandler (xml:any) {
    const context = this
    const baseAcceptContext = getBaseApplicationContext.call(context, xml)
    const acceptCommonContext:ApplicationCommonContext = {
      ...baseAcceptContext,
      msgType: MsgType.VOICE,
      mediaId: xml.MediaId[0],
      format: xml.Format[0]
    }

    let matchedVoices = []

    context.stack.forEach((stackContext: Stack) => {
      if (stackContext.type === MsgType.VOICE) {
        matchedVoices = matchedVoices.concat(stackContext.handlers)
      }
    })

    await excuteHandler(context, acceptCommonContext, matchedVoices, 0)
  }

}
