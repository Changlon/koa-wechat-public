
import { Material as MaterialInterface } from 'material'
import  WechatApplication  from '../../typings'
import fs from 'fs'
import util from 'util'
import axios from 'axios'
import formData from 'form-data'

export class Material implements MaterialInterface {
    app: WechatApplication

    constructor (ctx) {
      this.app = ctx
      this.bindToThis()
    }

    private bindToThis () {
      const bindMethodList = [
        'addTmpMaterial',
        'addLongTimeMaterial',
        'removeLongTimeMaterial'
      ]

      bindMethodList.forEach(mName => {
        this[mName] = this[mName].bind(this)
      })
    }

    getFormLength (formData:formData) {
      return new Promise((resolve, reject) => {
        formData.getLength((err, len) => {
          if (err) reject(err)
          resolve(len)
        })
      })
    }

    async addTmpMaterial (localPath: string, type: string): Promise<any> {
      const app = this.app
      const apiUrl = app.apiUrl
      const accessToken = await app.getAccessToken()
      const url = util.format(apiUrl.uploadTmpFile, app.apiDomain, accessToken, type)
      if (!accessToken) throw new Error(`Material -- addTmpMaterial:access_token获取失败${accessToken}`)
      // eslint-disable-next-line new-cap
      const form = new formData()
      form.append('file', fs.createReadStream(localPath))
      const headers = form.getHeaders()
      const len = await this.getFormLength(form)
      headers['content-length'] = len || 0
      return (await axios.post(url, form, { headers })).data
    }

    async addLongTimeMaterial (localPath: string, type: string, desc?:{
       title:string,
       desc:string
   }): Promise<any> {
      const app = this.app
      const apiUrl = app.apiUrl
      const accessToken = await app.getAccessToken()
      const url = util.format(apiUrl.uploadFile, app.apiDomain, accessToken, type)
      if (!accessToken) throw new Error(`Material -- addLongTimeMaterial:access_token获取失败${accessToken}`)
      // eslint-disable-next-line new-cap
      const form = new formData()

      switch (type) {
        case 'image':
          form.append('media', fs.createReadStream(localPath))
          break
        case 'video' :

          form.append('media', fs.createReadStream(localPath))
          form.append('description', JSON.stringify({
            title: (desc && desc.title) || 'video_title',
            introduction: (desc && desc.desc) || 'video_introduction'
          }))
          break
      }

      // form.append("media",fs.createReadStream(localPath))
      const headers = form.getHeaders()
      const len = await this.getFormLength(form)
      headers['content-length'] = len || 0
      return (await axios.post(url, form, { headers })).data
    }

    async removeLongTimeMaterial (mediaId: string): Promise<any> {
      const app = this.app
      const apiUrl = app.apiUrl
      const $data = `{"media_id":"${mediaId}"}`
      const accessToken = await app.getAccessToken()
      if (!accessToken) throw new Error(`Material -- removeLongTimeMaterial:access_token获取失败${accessToken}`)
      const url = util.format(apiUrl.removeFile, app.apiDomain, accessToken)
      return (await axios.post(url,$data)).data
    }
}
