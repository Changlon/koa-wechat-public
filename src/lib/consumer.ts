
import { Consumer as ConsumerInterface } from 'consumer'
import  WechatApplication  from '../../typings'
import util from 'util'
import axios from 'axios'

export class Consumer implements ConsumerInterface {
    app: WechatApplication

    constructor (app:WechatApplication) {
      this.app = app
      this.bindToThis()
    }

    private bindToThis () {
      const bindMethodList = [
        'getUserDetail'
      ]

      bindMethodList.forEach(mName => {
        this[mName] = this.app[mName] =  this[mName].bind(this)
      })
    }

    async getUserDetail (openid: string): Promise<any> {
      const token = await this.app.getAccessToken()
      if (!token) throw new Error(`Consumer -- getUserDetail:access_token获取失败${token}`)
      const url = util.format(this.app.apiUrl.accessUserInfo, this.app.apiDomain, token, openid)
      const res = await axios.get(url)
      return res ? res.status === 200 ? res.data : res : undefined
    }
}
