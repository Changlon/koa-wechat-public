import { Ctx, WechatApplication } from '../../typings'
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
            'pushMiniProgramCardMsg'
          ]

          bindMethodList.forEach(mName => {
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
          return this.push(res)
        }

        async pushImageCustomerMsg (toUser: string, mediaId: string): Promise<any> {
          const $data = '{"touser":"' + toUser + '","msgtype":"image","image":{"media_id":"' + mediaId + '"}}'
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushImageCustomerMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          return this.push(res)
        }

        async pushVideoCustomerMsg (toUser: string, mediaId: string, thumbMediaId: string, title: string, desc: string): Promise<any> {
          const $data = '{"touser":"' + toUser + '","msgtype":"video","video":{"media_id":"' + mediaId + '","thumb_media_id":"' + (thumbMediaId || mediaId) + '","title":"' + title + '","description":"' + desc + '"}}'
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushVideoCustomerMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          return this.push(res)
        }

        async pushMiniProgramCardMsg (toUser: string, params?: { [k: string]: any }, miniConfig?: { title: string; appId: string; pagePath: string; thumbMediaId: string }): Promise<any> {
          const config = miniConfig || this.app.miniConfig
          if (!config) throw new Error(`Send -- pushMiniProgramCardMsg: 小程序配置信息缺失 --config ${config}`)
          const $data = `{"touser":"${toUser}","msgtype":"miniprogrampage","miniprogrampage":{"title":"${config.title}","appid":"${config.appId}","pagepath":"${config.pagePath}${params}","thumb_media_id":"${config.thumbMediaId || config.mediaId}"}}`
          const token = await this.app.getAccessToken()
          if (!token) throw new Error(`Send -- pushMiniProgramCardMsg:access_token获取失败${token}`)
          const url = util.format(this.app.apiUrl.accessMessage, this.app.apiDomain, token)
          const res = await axios.post(url, $data)
          return this.push(res)
        }
}
