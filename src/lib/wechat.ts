
import axios from 'axios'
import util from 'util'
import crypto from 'crypto'
import Handlers from './accept'
import apiUrl from './wetchat-common-api'
import WechatApplication, {  Next, WechatApplicationConfig, Ctx, Stack, ApplicationCommonContext, ApplicationEventContext } from '../../typings'
import { CryptoGraphyInterface } from 'cryptog'
import CryptoGraphy from '../utils/cryptoGraphyUtil'
import { EventType, MsgType, PatternType } from 'enum'
import Send from './send'
import { Material } from './material'
import { Consumer } from './consumer'


export default class WetchatPublic implements WechatApplication {
    config: WechatApplicationConfig
    token: string
    appId: string
    appSecret: string
    encodingAESKey?: string
    apiDomain: string
    apiUrl: { [key: string]: any }
    miniConfig: { [key: string]: any } 
    send:Send 
    material:Material 
    consumer:Consumer 
    ctx: Ctx
    next: Next
    stack: Stack[]
    msgIdQueque:Map<string,number>
    accessTokenCache:{
      access_token:string,
      expires_time:number
    }
    crypto:CryptoGraphyInterface
    menuHandler:()=>Promise<any>
    oauthHandler:(oauthData:any,ctx:Ctx,next:Next)=> Promise<any>
    [k:string]:any
    xmlKey?:string

    constructor (config:WechatApplicationConfig) {
      if (config) {
        this.init(config)
      }
    }

    init (config: WechatApplicationConfig): void {

      if(!config.appId || !config.appSecret || !config.token) {
          throw new Error(`请保证 appId,appSecret,token参数的正确传入:${config.appId},${config.appSecret},${config.token}`)
      }

      this.config = config
      this.token = config.token
      this.appId = config.appId
      this.appSecret = config.appSecret
      this.apiDomain = config.apiDomain || 'https://api.weixin.qq.com/'
      this.apiUrl = { ...config.apiUrl, ...apiUrl }
      this.crypto = new CryptoGraphy({
        token: config.token,
        appId: config.appId,
        encodingAESKey: config.encodingAESKey
      })
      this.stack = []
      this.msgIdQueque = new Map()
      this.accessTokenCache = { 
        access_token:'',
        expires_time:0
      }

      this.encodingAESKey = config.encodingAESKey
      this.miniConfig = config.miniConfig
      this.send = new Send(this,null,null) 
      this.material = new Material(this) 
      this.consumer = new Consumer(this) 
      this.xmlKey = config.xmlKey || "body"
    }
    
    start (): (ctx: Ctx, next?: Next) => any {
      return async (ctx, next) => {
        const req = ctx.request
        let method = <string> req.method
        method = method.toLowerCase()
        switch (method) {
          case 'get' :
            await this.auth()(ctx, next)
            break
          case 'post':
            await this.handle()(ctx, next)
            break
        }
      }
    }

    auth (): (ctx: Ctx, next: Next) => any {
      return async (ctx,next) => {
        this.ctx = ctx
        this.next = next
        const req = ctx.request
        const { signature, timestamp, nonce, echostr, code, state } = req.query
        if (!code) {
          const array = [this.token, timestamp, nonce]
          array.sort()
          const tempStr = array.join('')
          const hashCode = crypto.createHash('sha1')
          const resultCode = hashCode.update(tempStr, 'utf8').digest('hex')
          resultCode === signature ? ctx.body = echostr : ctx.body = 'mismatch'
          return this.menuHandler ? await Promise.resolve(this.menuHandler()) : undefined
        }
        
        // 处理网页授权认证
        await this.handleWebPageOauth(code,state,ctx,next)
      }
    }

    async handleWebPageOauth (code:string, state:string,ctx:Ctx,next:Next):Promise<any> {
      const appId = this.appId
      const secret = this.appSecret
      const authuRL = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`
      const resData = await axios.get(authuRL) 
      const data = resData.status === 200 ? resData.data : undefined
      if (!data) throw new Error(`用户获取token失败！${resData.data.errcode} : ${resData.data.errmsg}`)
      data.state = state
      data.msgType = "event"
      data.event = "oauth"
      
      return this.oauthHandler ? await Promise.resolve(this.oauthHandler(data,ctx,next)) : ctx.body = "no oauthHandler"
    }

    // eslint-disable-next-line camelcase
    oauth (handler: (oauthData: { msgType:string;event:string; access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string; state: string },ctx:Ctx,next:Next) => any): WechatApplication {
      return (this.oauthHandler = handler) && this
    }

    handle (): (ctx:Ctx, next: Next) => Promise<any> {
      return async (ctx, next) => {
        this.ctx = ctx
        this.next = next
        try {
            let req = ctx.request; let xml 

            xml = req[this.xmlKey].xml ?? req[this.xmlKey] 

            if(!xml) {
              throw new Error("koa-wechat-public:未解析到xml数据")
            }

            if (req.query.encrypt_type === 'aes') {
              // eslint-disable-next-line camelcase
              const { msg_signature, timestamp, nonce } = req.query
              const decodeXml = this.crypto.init({
                msgSignature: msg_signature,
                timestamp,
                nonce
              }).decryptMsg(xml.Encrypt[0])
              Object.keys(decodeXml).forEach(key => {
                decodeXml[key] = [decodeXml[key]]
              })
              xml = decodeXml
            } 
            
            if(!xml.FromUserName || !xml.CreateTime || !xml.FromUserName[0] || !xml.CreateTime[0]) {  
              throw new Error("koa-wechat-public: 不是微信标准的请求报文") 
            }
            
            const fromUserName = xml.FromUserName && xml.FromUserName[0],
                  createtime = xml.CreateTime && xml.CreateTime[0]  

            
            //消息排重
            if(!this.msgIdQueque.has(`${fromUserName}-${createtime}`)) { 
              this.msgIdQueque.set(`${fromUserName}-${createtime}`,new Date().getTime())
              this.ctx = ctx
              this.next = next
              const msgType = <string> (xml.MsgType[0]) + 'Handler'
              await Promise.resolve(Handlers[msgType].call(this, xml))
            }
            
            //清理key
            const keyIter =  this.msgIdQueque.keys() 
            let k_ =  keyIter.next()
            while( !k_.done ) {  
                if( (new Date().getTime() - this.msgIdQueque.get(k_.value))
                  > ( 1000 * 15 ) 
                ){
                  this.msgIdQueque.delete(k_.value) 
                }
                k_ = keyIter.next()
            }
          
        } catch (error) {
           throw  new Error(`koa-wechat-public: 公众号消息异常 - ${error.message}`)
        }
        

      }
    }

    async getAccessToken () {
      const currentTime = new Date().getTime()
      const url = util.format(this.apiUrl.accessTokenApi, this.apiDomain, this.appId, this.appSecret) 

      if( 
          this.accessTokenCache.access_token &&  
          this.accessTokenCache.expires_time && 
          this.accessTokenCache.expires_time > currentTime 
          
        ) {
          return this.accessTokenCache.access_token
        }

      const resStatus = await axios.get(url)
      if (resStatus.status === 200) {
        const data = resStatus.data
        if(!data) throw new Error(`koa-wechat-public getAccessToken (err) :  请检查公众号appid,secret 配置 !`)
        this.accessTokenCache.access_token = data.access_token
        this.accessTokenCache.expires_time = new Date().getTime() + data.expires_in * 1000
        return data.access_token
      }else{
        throw new Error(`koa-wechat-public getAccessToken (err) :  请求异常请检查是否配置公众号白ip白名单 ：${resStatus}`)
      }
    }

    createMenu (menuViews: { [k: string]: any }):WechatApplication {
      const menuHandler = async () => {
        const token = await this.getAccessToken()
        if (!token) throw new Error(`WechatApplication - createMenu : access_token is invalid ${token}`)
        const url = util.format(this.apiUrl.createMenu, this.apiDomain, token)
        const res = await axios.post(url, JSON.stringify(menuViews))
        if(res.data.errcode!==0) throw Error(`createMenu failed! Possible caused by : ${res.data.errmsg}`)
        return res.data
      }

      this.menuHandler = menuHandler

      return this
    }

    text (content: string | RegExp, userHandler: (acc: ApplicationCommonContext) => any) :WechatApplication {
      const patternType = Object.prototype.toString.call(content)
      const textContext:Stack = {
        type: MsgType.TEXT,
        handlers: [userHandler],
        pattern: content
      }
      if (patternType === '[object String]') {
        textContext.patternType = PatternType.STRING
        for (let i = 0; i < this.stack.length; ++i) {
          const context = this.stack[i]
          if (context.type === MsgType.TEXT && content === context.pattern) {
            context.handlers.push(userHandler)
            return this
          }
        }
        this.stack.push(textContext)
        return this
      } else if (patternType === '[object RegExp]') {
        textContext.patternType = PatternType.REGEXP
        this.stack.push(textContext)
        return this
      } else {
        throw new Error('参数错误: text(content:string|RegExp,...) content 传入的应该是一个字符串或正则匹配表达式!')
      }
    }

    image (hander: (acc: ApplicationCommonContext) => any): WechatApplication {
      const imageContext:Stack = {
        type: MsgType.IMAGE,
        handlers: [hander]
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.IMAGE) {
          context.handlers.push(hander)
          return this
        }
      }

      this.stack.push(imageContext)

      return this
    }

    video (handler: (acc: ApplicationCommonContext) => any): WechatApplication {
      const videoContext:Stack = {
        type: MsgType.VIDEO,
        handlers: [handler]

      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.VIDEO) {
          context.handlers.push(handler)
          return this
        }
      }

      this.stack.push(videoContext)

      return this
    }

    voice (handler: (acc: ApplicationCommonContext) => any): WechatApplication {
      const voiceContext:Stack = {
        type: MsgType.VOICE,
        handlers: [handler]
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.VOICE) {
          context.handlers.push(handler)
          return this
        }
      }

      this.stack.push(voiceContext)

      return this
    }

    subscribe (handler: (acc: ApplicationEventContext) => any): WechatApplication {
      const subscribeContext:Stack = {
        type: MsgType.EVENT,
        handlers: [handler],
        eventType: EventType.SUBSCRIBE
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.EVENT && context.eventType === EventType.SUBSCRIBE) {
          context.handlers.push(handler)
          return this
        }
      }

      this.stack.push(subscribeContext)

      return this
    }

    unsubscribe (handler: (acc: ApplicationEventContext) => any): WechatApplication {
      const unsubscribContext:Stack = {
        type: MsgType.EVENT,
        handlers: [handler],
        eventType: EventType.UNSUBSCRIBE
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.EVENT && context.eventType === EventType.UNSUBSCRIBE) {
          context.handlers.push(handler)
          return this
        }
      }

      this.stack.push(unsubscribContext)

      return this
    }

    scan (handler: (acc: ApplicationEventContext) => any): WechatApplication {
      const scanContext:Stack = {
        type: MsgType.EVENT,
        handlers: [handler],
        eventType: EventType.SCAN
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.EVENT && context.eventType === EventType.SCAN) {
          context.handlers.push(handler)
          return this
        }
      }

      this.stack.push(scanContext)

      return this
    }

    menu (handler: (acc: ApplicationEventContext) => any): WechatApplication {
      const menuContext:Stack = {
        type: MsgType.EVENT,
        handlers: [handler],
        eventType: EventType.MENU
      }

      for (let i = 0; i < this.stack.length; ++i) {
        const context = this.stack[i]
        if (context.type === MsgType.EVENT && context.eventType === EventType.MENU) {
          context.handlers.push(handler)
          return this
        }
      }
      this.stack.push(menuContext)
      return this
    }
}
