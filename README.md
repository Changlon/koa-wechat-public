::: hljs-center

#  一款基于Koa的微信公众号开发框架

:::

## koa-wechat

![node version](https://img.shields.io/badge/node-14.16.1-brightgreen.svg)  ![npm version](https://img.shields.io/badge/npm-6.14.12-blue.svg) ![koa version](https://img.shields.io/badge/koa-^2.13.4-black.svg)  ![typescript](https://img.shields.io/badge/typescript-^4.5.2-blue.svg) ![typescript](https://img.shields.io/badge/eslint-7.12.1-purple.svg)

## 介绍
1. koa-wetchat 需要node v7.6.0+ 来支持 ES2015 和 async  
2. 需要结合 koa-xml-body 中间件来使用
3. 可以结合koa-router,也可以直接单当做koa的中间件使用 


## 功能
1. 微信公众号验证
2. 微信公众号信息加密
3. 获取access_token
4. 接收普通消息
    -  文本消息的接受
    -  语音消息的接受
    - 视频消息接受
5. 发送消息
	- 自动回复 (文本,语音，视频)
6. 接收事件推送
	- 用户关注公众号
	- 用户取关公众号
	- 自定义菜单事件推送

7. 客服接口
	- 推送文本消息
	- 推送图片消息
	- 推送视频消息
	- 推送小程序卡片
8. 自定义菜单
9. 网页授权获取用户基本信息
	

## 安装
### npm
```
$ npm install koa-wechat
```

### yarn 
```
$ yarn add koa-wechat
```

##  使用

```js
const Koa = require('koa') 
const XmlParser = require ('koa-xml-body') 
const app = new Koa()
const Wetchat = require('koa-wechat')

//配置你的公众号参数
const wechatApp = new Wetchat({
    token: TOKEN,
    appId: APPID,
    appSecret: APPSECRET,
    encodingAESKey: encodingAESKey 
})

//编写一个接受消息的处理器
wechatApp.text('你好', async acc=>{ 
    acc.send.sendTxtMsg("你也好")
})


app.use(new XmlParser()) 
app.use(wechatApp.start()) 
app.listen(3001)

```

#### 在公众号后台将你的服务器地址URL填写上，将公众号appid,令牌token,消息加密秘钥填入构造函数的参数当中，一个简单的公众号应用就开发完成! 下面来介绍如何使用这个框架.




