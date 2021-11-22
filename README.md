#  一款基于Koa的微信公众号开发框架
![node version](https://img.shields.io/badge/node-v14.16.1-brightgreen.svg)  ![npm version](https://img.shields.io/badge/npm-0.1.0-blue.svg) ![in npm version](https://img.shields.io/badge/koa-^2.13.4-purple.svg)  ![typescript](https://img.shields.io/badge/typescript-^4.5.2-blue.svg) 

## koa-wechat
## 介绍
1. koa-wetchat 需要node v7.6.0+ 来支持 ES2015 和 async  
2. 依赖koa-xml-body 中间件 
3. 可结合koa-router,也可以直接单当做koa的中间件来使用 
4. github: [仓库地址](https://github.com/Changlon/koa-wechat-public)



	

## 安装
- npm
```
$ npm install koa-wechat-public
```

- yarn 
```
$ yarn add koa-wechat-public
```

##  使用

```js
const Koa = require('koa') 
const XmlParser = require ('koa-xml-body') 
const Wetchat = require('koa-wechat-public')
const app = new Koa()

//配置你的公众号参数
const wechatApp = new Wetchat({
    token: TOKEN,
    appId: APPID,
    appSecret: APPSECRET
})

//编写一个接受消息的处理器
wechatApp.text('你好', async acc=>{ 
    acc.send.sendTxtMsg("你也好")
})


app.use(new XmlParser()) 
app.use(wechatApp.start()) 
app.listen(3001)

```



@[toc](目录)



## 功能
### 1. 微信公众号验证 

#### 全URL路径验证
	
- 首先在微信[微信公众平台](公众平台)配置账号信息,获取需要配置的 APPID，APPSECRET，TOKEN;
填写你的服务器 URL 如(http://example.com/) 。		   
- 在 ```new``` 构造函数中传入必须的参数 ```appId,token,appSecret ``` 
- 使用实例的 ```start ``` 方法完成接入验证。 **微信服务器接入验证使用```get```请求，其他的消息数据均用```post```请求该url地址。** 

上面的例子中```Wetchat```的实例对象(我们下面简称:```wechatApp```) 会自动判断请求的类型，如果是```get```请求则做接入验证，如果是```post```请求则调用对应的处理器执行。

#### 结合koa-router 接入验证 
```js
router.all('/wechat',wechat.start()) 
```

上面的写法等价于
```js
router.get('/wechat',wechat.auth())  //接入验证
router.post('/wechat',wechat.handle())  //处理微信服务器发送的消息
```
这时候需要在你的微信公众平台修改服务器URL为 ```http://example.com/wechat```  。


### 2. 微信公众号信息加密
如果你的微信公众号后台配置的不是明文模式，那么每次微信服务器发送到你服务器上的数据都是加密过后的。这时候```wechatApp```实例会自动判断消息是否是加密的如果是加密模式则会自动解密，并会已加密的模式将数据返回给服务器，无需开发者处理繁琐的加密解密的步骤。

需要在实例时传入 ```encodingAESKey```秘钥串：

```js
const wechatApp = new Wetchat({
    token: TOKEN,
    appId: APPID,
    appSecret: APPSECRET,
    encodingAESKey:ENCODINGAESKEY
})
```
### 3. 获取access_token  
在实例上有一个 ```getAccessToken ```的原型方法。该方法返回一个```Promise<access_token:string> ``` 。

使用示例: 

```js
wechatApp.text('token', async acc=>{ 
	 const token =  await acc.context.getAccessToken() 
         acc.send.sendTxtMsg(token)		
})
```
在公众号发送 消息:token,返回公众号的 ```access_token```,开发者可以拿取这个```access_token```做进一步的操作。

 **Tip**: 当调用处理器(```用户编写的异步函数```)时,实例在接受到匹配消息或事件时会将此次请求的一些上下文信息(如消息内容,发送者的openid...)包裹起来传入处理器第一个参数:```acc```。开发者这是候可以通过获取```acc```上的一些对象或方法进行下一步操作。

**上面这个例子中的 ```context```属性指向实例:```wechatApp```**

### 4. 接收普通消息



普通消息的接受的数据字段可以参考 [普通消息数据字段](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html)
   ####  文本消息的接收.text 

```js 
wechatApp.text(
'text', 
async acc=>{ 
 const {toUser,fromUser,createTime,msgType,content,msgId} = acc         				 	 	
 acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,content,msgId].join('\n')) 
})
	
```
			
   ####  图片消息的接收.image
```js
wechatApp.image(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,picUrl,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,picUrl,mediaId].join('\n')) 
})            
```


   ####  语音消息的接收.voice
```js
wechatApp.voice(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,format,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,format,mediaId].join('\n')) 
})            
```



   ####  视频消息接收.video 
```js
wechatApp.video(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,thumbMediaId,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,thumbMediaId,mediaId].join('\n')) 
})            
```

**Tip**:不能在一种消息类型的处理器中获取其他消息类型的数据字段，否则会出现 ```null```或 ```undefined```

### 5. 接收事件推送
接收事件推送的数据字段可以参考 [普通事件数据字段](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_event_pushes.html)
   ####  用户关注公众号.subscribe

```js
wechatApp.subscribe(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId].join('\n')) 
})     
```
			
   ####  用户取关公众号.unsubscribe

```js
wechatApp.unsubscribe(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId].join('\n')) 
})   
```

   ####  自定义菜单事件推送.menu 

```js
wechatApp.menu(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,event,eventKey} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,event,eventKey].join('\n')) 
})  
```


### 6. 发送消息 & 客服接口

自动回复消息和客服消息都封装在 ```Send``` 模块中，开发者可以通过处理器函数中的 ```acc```参数获取 ``` const send = acc.send   ```

#### 自动回复

- 自动回复文本
	```send.sendTxtMsg(content)``` 
参数说明： 

|参数名|类型|说明|
|-|-|-|
|content|string|自定回复的文本| 

- 自动回复图片
	```send.sendImageMsg(mediaId)```  

参数说明： 

|参数名|类型|说明|
|-|-|-|
|mediaId|string|通过素材接口上传到微信服务器中的临时或永久文件的媒体id| 


- 自定回复视频
	```send.sendVideoMsg(mediaId,title,desc)```  

参数说明： 

|参数名|类型|可选|说明|
|-|-|-|-|
|mediaId|string|否|通过素材接口上传到微信服务器中的临时或永久文件的媒体id| 
|title|string|是|显示的标题| 
|desc|string|是|描述信息|  

#### 客服消息推送


- 推送文本消息
```  send.pushTxtCustomerMsg(toUser,content)```

参数说明： 

|参数名|类型|可选|说明|
|-|-|-|-|
|toUser|string|否|要推送用户的openid| 
|content|string|否|推送的文本消息|  

       


- 推送图片消息
```  send.pushImageCustomerMsg(toUser,mediaId)```

参数说明： 

|参数名|类型|可选|说明|
|-|-|-|-|
|toUser|string|否|要推送用户的openid| 
|mediaId|string|否|通过素材接口上传文件的媒体id|  


- 推送视频消息


```  send.pushVideoCustomerMsg(toUser,mediaId,thumbMediaId,title,desc)```

参数说明： 

|参数名|类型|可选|说明|默认值|
|-|-|-|-| -|
|toUser|string|否|要推送用户的openid| |
|mediaId|string|否|通过素材接口上传文件的媒体id|  |
|thumbMediaId|string|是|素材接口上传文件的媒体id;用来展示视频封面|meidaId| 
|title|string|是|标题信息|"title"| 
|desc|string|是|描述信息|"desc"| 

- 推送小程序卡片


```  send.pushMiniProgramCardMsg(toUser,miniConfig,params)```

参数说明： 

|参数名|类型|可选|说明|默认值|
|-|-|-|-| -|
|toUser|string|否|要推送用户的openid| |
|miniConfig|object:{ title: string; appId: string; pagePath: string; thumbMediaId: string }|是|小程序配置信息|通过构造函数传入的 miniConfig|
|params|object:{[key:string]:any}|是|设置打开小程序的路径后的参数||  

### 7. 用户接口

用户接口封装在```Consumer ```模块中，开发者可以通过处理器函数中的 acc参数获取``` const consumer = acc.consumer```

#### 获取用户信息

```consumer.getUserDetail(openid)```
参数说明： 

|参数名|类型|可选|说明|
|-|-|-|-|
|openid|string|否|可以通过```acc.fromUser```获取用户的openid|    


### 8. 素材管理

素材管理接口封装在```Material ```模块中，开发者可以通过处理器函数中的 acc参数获取 ```const material = acc.material```

媒体素材接口参考 : [素材接口](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html)

#### 上传临时文件

``` material.addTmpMaterial(localPath, type) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|localPath|string|否|本地文件路径|    
|type|string|否|素材类型：image,video,voice...|    


返回值: ```Promise<object>```


#### 上传永久文件

``` material.addLongTimeMaterial(localPath,type,desc) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|localPath|string|否|本地文件路径|    
|type|string|否|素材类型：image,video; tip:目前只支持两种|    
|desc|object:{title:string,desc:string}|是|描述信息|     

返回值: ```Promise<object>```



#### 删除永久文件


``` material.removeLongTimeMaterial(mediaId) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|mediaId|string|否|媒体id|     
   

返回值: ```Promise<object>```

### 9. 自定义菜单 
```wechatApp.createMenu(menuData)``` 
参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|menuData|object:{[key:string]:any}|否|菜单json对象|   


创建示例: 

```js

```


### 10. 网页授权获取用户基本信息   

## 配置

## 接口 
#### wechatApp
##### .text(pattern:string|regExp,handler:async acc=>any) => wechatApp 
##### .image(handler:async acc=>any) => wechatApp 
##### .voice(handler:async acc=>any) => wechatApp 
##### .video(handler:async acc=>any) => wechatApp 


## 类型



## 支持


