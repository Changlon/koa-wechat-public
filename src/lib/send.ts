import WechatApplication, { Ctx }  from '../../typings'
import * as SEND from 'send'
import axios from 'axios'
import util from 'util'
import SendUtil from '../utils/sendUtil'

/**
 * 发送消息模块
 */
export default class Send implements SEND.Send {
        app:WechatApplication
        ctx:Ctx
        fromUser:string
        toUser:string
        sendUtil:SendUtil

        constructor (ctx:WechatApplication, fromUser:string, toUser:string) {
          this.app = ctx
          this.ctx = this.app.ctx
          this.sendUtil = new SendUtil()
          this.fromUser = fromUser
          this.toUser = toUser
          this.bindToThis()
        }

        private bindToThis () {
          const bindMethodList = [
            'sendTxtMsg',
            'sendImageMsg',
            'sendVideoMsg',
            'pushTxtCustomerMsg',
            'pushImageCustomerMsg',
            'pushVideoCustomerMsg',
            'pushMiniProgramCardMsg',
            'pushTemplateMsg'
          ]

          bindMethodList.forEach(mName => {  
            mName.startsWith('push') ?
             this[mName] = this.app[mName]  = this[mName].bind(this)   :  
             this[mName] = this[mName].bind(this) 
          })
        }

        send (xml: string): boolean {
          xml = this.app.ctx.request.query.encrypt_type === 'aes' ? this.app.crypto.encryptMsg(xml) : xml
          this.ctx.type = 'application/xml'
          this.ctx.body = xml
          return false
        }

        push (res:any):{[k:string]:any}|undefined {
          return res ? res.status === 200 ? res.data : res : undefined
        }

        sendTxtMsg (content:string) {
          const xml = this.sendUtil.createTxtMsg(this.toUser, this.fromUser, content)
          return this.send(xml)
        }

        sendImageMsg (mediaId: string) {
          const xml = this.sendUtil.createImageMsg(this.toUser, this.fromUser, mediaId)
          return this.send(xml)
        }

        sendVideoMsg (mediaId: string, title?: string, desc?: string) {
          const xml = this.sendUtil.createVideoMsg(this.toUser, this.fromUser, mediaId, title, desc)
          return this.send(xml)
        }

        async pushTxtCustomerMsg (toUser: string, content: string): Promise<any> {
          const $data = '{"touser":"' + toUser + '","msgtype":"text","text":{"content":"' + content + '"}}'
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushTxtCustomerMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          if(res.data.errcode!==0) {console.log(res.data.errmsg); throw new Error(res.data.errmsg)}
          return this.push(res)
        }

        async pushImageCustomerMsg (toUser: string, mediaId: string): Promise<any> {
          const $data = '{"touser":"' + toUser + '","msgtype":"image","image":{"media_id":"' + mediaId + '"}}'
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushImageCustomerMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          if(res.data.errcode!==0) {console.log(res.data.errmsg); throw new Error(res.data.errmsg)}
          return this.push(res)
        }

        async pushVideoCustomerMsg (toUser: string, mediaId: string, thumbMediaId?: string, title?: string, desc?: string): Promise<any> {
          const $data = '{"touser":"' + toUser + '","msgtype":"video","video":{"media_id":"' + mediaId + '","thumb_media_id":"' + (thumbMediaId || mediaId) + '","title":"' + (title|| "title") + '","description":"' + (desc||"desc") + '"}}'
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushVideoCustomerMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          if(res.data.errcode!==0) {console.log(res.data.errmsg); throw new Error(res.data.errmsg)}
          return this.push(res)
        }

        async pushMiniProgramCardMsg (toUser: string,  miniConfig?: { title: string; appId: string; pagePath: string; thumbMediaId: string },params?: { [k: string]: any }): Promise<any> { 
          
          const config = miniConfig || this.app.miniConfig 
          let paramStr =  config.pagePath[config.pagePath.length-1] === "?" ? "" : "?"
          if(params) {
            Object.keys(params).forEach(key=>{
              paramStr = paramStr + `${key}=${params[key]}&`
            })
            paramStr = paramStr.substring(0,paramStr.length-1)
          }
          if (!config) throw new Error(`Send -- pushMiniProgramCardMsg: 小程序配置信息缺失 --config ${config}`)
          const $data = `{"touser":"${toUser}","msgtype":"miniprogrampage","miniprogrampage":{"title":"${config.title}","appid":"${config.appId}","pagepath":"${config.pagePath}${paramStr}","thumb_media_id":"${config.thumbMediaId }"}}`
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushMiniProgramCardMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          if(res.data.errcode!==0) {console.log(res.data.errmsg); throw new Error(res.data.errmsg)}
          return this.push(res)
        }

        async pushTemplateMsg(toUser: string, templateId: string, data?: { [k: string]: any }, url?: string, miniprogram?:{
          appid:string,
          pagepath:string
        }, topcolor?: string) {  
          const miniConfig = this.app.miniConfig 
          const defaultMiniProgram = miniConfig ? {appid:miniConfig.appId,pagepath:miniConfig.pagePath} : undefined 
          const $data = `{"touser":"${toUser}","template_id":"${templateId}","url":"${url || ""}","miniprogram":${
            miniprogram ? JSON.stringify(miniprogram) : defaultMiniProgram ? JSON.stringify(defaultMiniProgram) : JSON.stringify({})
          },"topcolor":"${topcolor || "#ff0000"}","data":${JSON.stringify(data)}}` 
          const token = await this.app.getAccessToken() 
          if(!token) throw new Error(`Send -- pushTemplateMsg access_token获取失败 ${token}`)
          const url_ = util.format(this.app.apiUrl.template,this.app.apiDomain,token)  
          const res = await axios.post(url_,$data) 
          if(res.data.errcode!==0) {console.log(res.data.errmsg); throw new Error(res.data.errmsg)}
          return this.push(res) 
        } 
        
}
