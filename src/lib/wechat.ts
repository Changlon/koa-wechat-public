
import axios from 'axios'
import util from 'util'
import crypto from 'crypto'

import fs from 'fs'
import Handlers from './accept'

import accessTokenCache from '../access_token_cache.json'

import apiUrl from './wetchat-common-api'

import { MsgType, Next, WechatApplication, WechatApplicationConfig, Ctx, Stack, ApplicationCommonContext, ApplicationEventContext, PatternType, EventType } from '../../typings'
import { CryptoGraphyInterface } from 'cryptog'
import CryptoGraphy from '../utils/cryptoGraphyUtil'
const spearator = process.platform === 'win32' ? '\\' : '/'

export default class WetchatPublic implements WechatApplication {
    config: WechatApplicationConfig
    token: string
    appId: string
    appSecret: string
    encodingAESKey?: string
    apiDomain: string
    apiUrl: { [key: string]: any }
    miniConfig: { [key: string]: any }
    ctx: Ctx
    next: Next
    stack: Stack[]
    crypto:CryptoGraphyInterface
    menuHandler:()=>any
    oauthHandler:(oauthData:any)=>any

    constructor (config?:WechatApplicationConfig) {
      if (config) {
        this.init(config)
      }
    }

    init (config: WechatApplicationConfig): void {
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
      this.encodingAESKey = config.encodingAESKey
      this.miniConfig = config.miniConfig
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

    auth (): (ctx: Ctx, next?: Next) => any {
      return async (ctx) => {
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
        this.handleWebPageOauth(code, state)
      }
    }

    async handleWebPageOauth (code:string, state:string):Promise<any> {
      const appId = this.appId
      const secret = this.appSecret
      const authuRL = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`
      const resData = await axios.get(authuRL)
      const data = resData.status === 200 ? resData.data : undefined
      if (!data) throw new Error(`用户获取token失败！${resData.data.errcode} : ${resData.data.errmsg}`)
      data.state = state
      return this.oauthHandler ? Promise.resolve(this.oauthHandler(data)) : undefined
    }

    // eslint-disable-next-line camelcase
    oauth (handler: (ctx: { access_token: string; expires_in: number; refresh_token: string; openid: string; scope: string; state: string }) => any): WechatApplication {
      const that = this
      function handler_ (data) {
        handler.call(this, { data, app: that })
      }
      return (this.oauthHandler = handler_) && this
    }

    handle (): (ctx:Ctx, next?: Next) => Promise<any> {
      return async (ctx, next) => {
        const req = ctx.request; let xml
        if (req.query.encrypt_type === 'aes') {
          // eslint-disable-next-line camelcase
          const { msg_signature, timestamp, nonce } = req.query
          const decodeXml = this.crypto.init({
            msgSignature: msg_signature,
            timestamp,
            nonce
          }).decryptMsg(req.body.xml.Encrypt[0])
          Object.keys(decodeXml).forEach(key => {
            decodeXml[key] = [decodeXml[key]]
          })
          xml = decodeXml
        } else {
          xml = req.body && req.body.xml
        }

        if (!xml) {
          throw new Error(`
               wechatApplication warn:  请使用中间件!
               示例:
               app.use(xmlParser())  
               app.use(bodyParser()) 
               app.use(wetchatApp.start()) 
            `)
        }

        this.ctx = ctx
        this.next = next
        const msgType = <string> (xml.MsgType[0]) + 'Handler'
        await Promise.resolve(Handlers[msgType].call(this, xml))
      }
    }

    async getAccessToken () {
      const currentTime = new Date().getTime()
      const url = util.format(this.apiUrl.accessTokenApi, this.apiDomain, this.appId, this.appSecret)
      if (accessTokenCache.access_token && accessTokenCache.expires_time && accessTokenCache.expires_time > currentTime) {
        return accessTokenCache.access_token
      }
      const resStatus = await axios.get(url)
      if (resStatus.status === 200) {
        const data = resStatus.data
        accessTokenCache.access_token = data.access_token
        accessTokenCache.expires_time = new Date().getTime() + (parseInt(data.expires_in) - 200) * 1000
        fs.writeFile(`${__dirname}${spearator}access_token_cache.json`, JSON.stringify(accessTokenCache), () => {})
        return data.access_token
      }
      return ''
    }

    createMenu (menuViews: { [k: string]: any }):WechatApplication {
      const menuHandler = async () => {
        const token = await this.getAccessToken()
        if (!token) throw new Error(`WechatApplication - createMenu : access_token is invalid ${token}`)
        const url = util.format(this.apiUrl.createMenu, this.apiDomain, token)
        const res = await axios.post(url, JSON.stringify(menuViews))
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
