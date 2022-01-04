
<img src="/docs/logo.png" alt="Koa middleware framework for wehchat" width="100%" heigth="250" /> 


# <span id="head1"> 一款基于Koa的微信公众号开发框架</span>
![node version](https://img.shields.io/badge/node-v14.16.1-brightgreen.svg)  ![npm version](https://img.shields.io/badge/npm-0.1.0-blue.svg) ![in npm version](https://img.shields.io/badge/koa-^2.13.4-purple.svg)  ![typescript](https://img.shields.io/badge/typescript-^4.5.2-blue.svg) 

## <span id="head2"> koa-wechat</span>
## <span id="head3"> 介绍</span>
1. koa-wetchat 需要node v7.6.0+ 来支持 ES2015 和 async  
2. 依赖koa-xml-body 中间件 
3. 可结合koa-router,也可以直接单当做koa的中间件来使用 
4. github: [仓库地址](https://github.com/Changlon/koa-wechat-public)
5. 增加了微信服务器消息5秒未回应消息重发的处理机制

## <span id="head4"> 安装</span>
- npm
```
$ npm install koa-wechat-public
```

- yarn 
```
$ yarn add koa-wechat-public
```

## <span id="head5"> 使用</span>

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



- [ 一款基于Koa的微信公众号开发框架](#head1)
	- [ koa-wechat](#head2)
	- [ 介绍](#head3)
	- [ 安装](#head4)
	- [ 使用](#head5)
	- [ 功能](#head6)
		- [1. 微信公众号验证 ](#head7)
			- [ 全URL路径验证](#head8)
			- [结合koa-router 接入验证 ](#head9)
		- [2. 微信公众号信息加密](#head10)
		- [3. 获取access_token  ](#head11)
		- [4. 接收普通消息](#head12)
			- [ 文本消息的接收.text ](#head13)
			- [ 图片消息的接收.image](#head14)
			- [ 语音消息的接收.voice](#head15)
			- [ 视频消息接收.video ](#head16)
		- [5. 接收事件推送](#head17)
			- [ 用户关注公众号.subscribe](#head18)
			- [ 用户取关公众号.unsubscribe](#head19)
			- [ 自定义菜单事件推送.menu ](#head20)
		- [6. 发送消息 & 客服接口](#head21)
			- [ 自动回复](#head22)
			- [ 客服消息推送](#head23)
		- [7. 用户接口](#head24)
			- [ 获取用户信息](#head25)
			- [ 上传永久文件](#head26)
		- [8. 素材管理](#sucai)
			- [ 上传临时文件](#sucai-1)
			- [ 上传永久文件](#head26)	
			- [ 删除永久文件](#sucai-2)
		- [9. 自定义菜单 ](#head27)
	- [配置 ](#head28)
	- [ 类型](#head29)
	- [ 支持](#head30)
	
## <span id="head6"> 功能</span>
### <span id="head7">1. 微信公众号验证 </span>

#### <span id="head8"> 全URL路径验证</span>
	
- 首先在微信[微信公众平台](公众平台)配置账号信息,获取需要配置的 APPID，APPSECRET，TOKEN;
填写你的服务器 URL 如(http://example.com/) 。		   
- 在 ```new``` 构造函数中传入必须的参数 ```appId,token,appSecret ``` 
- 使用实例的 ```start ``` 方法完成接入验证。 **微信服务器接入验证使用```get```请求，其他的消息数据均用```post```请求该url地址。** 

上面的例子中```Wetchat```的实例对象(我们下面简称:```wechatApp```) 会自动判断请求的类型，如果是```get```请求则做接入验证，如果是```post```请求则调用对应的处理器执行。

#### <span id="head9">结合koa-router 接入验证 </span>
```js
router.all('/wechat',wechat.start()) 
```

上面的写法等价于
```js
router.get('/wechat',wechat.auth())  //接入验证
router.post('/wechat',wechat.handle())  //处理微信服务器发送的消息
```
这时候需要在你的微信公众平台修改服务器URL为 ```http://example.com/wechat```  。


### <span id="head10">2. 微信公众号信息加密</span>
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
### <span id="head11">3. 获取access_token  </span>
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

### <span id="head12">4. 接收普通消息</span>



普通消息的接受的数据字段可以参考 [普通消息数据字段](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html)
#### <span id="head13"> 文本消息的接收.text </span>

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
			
#### <span id="head14"> 图片消息的接收.image</span>
```js
wechatApp.image(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,picUrl,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,picUrl,mediaId].join('\n')) 
})            
```


#### <span id="head15"> 语音消息的接收.voice</span>
```js
wechatApp.voice(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,format,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,format,mediaId].join('\n')) 
})            
```



#### <span id="head16"> 视频消息接收.video </span>
```js
wechatApp.video(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,thumbMediaId,mediaId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,thumbMediaId,mediaId].join('\n')) 
})            
```

**Tip**:不能在一种消息类型的处理器中获取其他消息类型的数据字段，否则会出现 ```null```或 ```undefined```

### <span id="head17">5. 接收事件推送</span>
接收事件推送的数据字段可以参考 [普通事件数据字段](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_event_pushes.html)
#### <span id="head18"> 用户关注公众号.subscribe</span>

```js
wechatApp.subscribe(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId].join('\n')) 
})     
```
			
#### <span id="head19"> 用户取关公众号.unsubscribe</span>

```js
wechatApp.unsubscribe(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId].join('\n')) 
})   
```

#### <span id="head20"> 自定义菜单事件推送.menu </span>

```js
wechatApp.menu(async acc=>{ 
const {toUser,fromUser,createTime,msgType,msgId,event,eventKey} = acc   
acc
.send
.sendTxtMsg([toUser,fromUser,createTime,msgType,msgId,event,eventKey].join('\n')) 
})  
```


### <span id="head21">6. 发送消息 & 客服接口</span>

自动回复消息和客服消息都封装在 ```Send``` 模块中，开发者可以通过处理器函数中的 ```acc```参数获取 ``` const send = acc.send   ```

#### <span id="head22"> 自动回复</span>

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

#### <span id="head23"> 客服消息推送</span>


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

### <span id="head24">7. 用户接口</span>

用户接口封装在```Consumer ```模块中，开发者可以通过处理器函数中的 acc参数获取``` const consumer = acc.consumer```

#### <span id="head25"> 获取用户信息</span>

```consumer.getUserDetail(openid)```
参数说明： 

|参数名|类型|可选|说明|
|-|-|-|-|
|openid|string|否|可以通过```acc.fromUser```获取用户的openid|    


### <span id = "sucai">	 8. 素材管理

素材管理接口封装在```Material ```模块中，开发者可以通过处理器函数中的 acc参数获取 ```const material = acc.material```

媒体素材接口参考 : [素材接口](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html)

####  <span id = "sucai-1"> 上传临时文件

``` material.addTmpMaterial(localPath, type) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|localPath|string|否|本地文件路径|    
|type|string|否|素材类型：image,video,voice...|    


返回值: ```Promise<object>```


#### <span id="head26"> 上传永久文件</span>

``` material.addLongTimeMaterial(localPath,type,desc) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|localPath|string|否|本地文件路径|    
|type|string|否|素材类型：image,video; tip:目前只支持两种|    
|desc|object:{title:string,desc:string}|是|描述信息|     

返回值: ```Promise<object>```



####  <span id = "sucai-2"> 删除永久文件


``` material.removeLongTimeMaterial(mediaId) ``` 

参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|mediaId|string|否|媒体id|     


返回值: ```Promise<object>```

### <span id="head27">9. 自定义菜单 </span>
```wechatApp.createMenu(menuData)``` 
参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|menuData|object:{[key:string]:any}|否|菜单json对象|   


创建示例: 

```js

//菜单在一次微信服务器对接验证中生效
wechatApp.createMenu({
"button":[
{	
"type":"click",
"name":"今日歌曲",
"key":"V1001_TODAY_MUSIC"
},
{
"name":"菜单",
"sub_button":[
{	
"type":"view",
"name":"搜索",
"url":"http://www.soso.com/"
},
{
"type":"click",
"name":"赞一下我们",
"key":"V1001_GOOD"
}]
}]
})
```


### 10. 网页授权获取用户基本信息   
```wechatApp.oauth(handler) ```
参数说明:

|参数名|类型|可选|说明|
|-|-|-|-|
|handler|Function|否|认证过后接受数据的处理回调函数，当认证完成时会将认证的信息，和koa的Ctx为参数，调用handler|     

示例代码:
```js
wechatApp.oauth(async function handler(data,ctx) {  
const openid = data.openid 
ctx.response.redirect('http://www.baidu.com?openid='+openid)    
	//可以做其他的一系列需要权限的操作
})
```
## <span id="head28">配置 </span>
	
下面是创建实例可传入的完整配置；

微信接口(apiUrl)的配置无需开发者传递，都是在程序中配置写好的。

目前实现的接口数量有限，我非常欢迎有想加入到这个项目中的伙伴和我一起丰富项目的功能！  

```js
const koaWechatPublicConfig = { 
appId:"APPID",
appSecret:"APPSECRET",
token:"TOKEN",
encodingAESKey:"ENCODINGAESKEY",
apiDomain :"https://api.weixin.qq.com/", //默认
apiUrl: {}, //可以在github仓库中查看已经实现的接口 ,默认不要传入! 
miniConfig:{ //相关联的小程序配置，如果你的公众号有弹出小程序的场景那么你可以在这里配置
title:"TITLE",
appId:"APPID",
pagePath:"PAGEPATH",
thumbMediaId:"THUMBMEDIAID" 
}
}
```



## <span id="head29"> 类型</span>
	
- 普通消息接受数据字段类型定义
```typescript
export type ApplicationCommonContext = {
context:WechatApplication,
send:Send,
material:Material,
consumer:Consumer,
toUser:string,
fromUser:string,
msgType:MsgType,
createTime:number,
msgId:string,
content?:string,
picUrl?:string,
mediaId?:string, 
format?:any, 
thumbMediaId?:string
locX?:number,
locY?:number,
scale?:number,
label?:string,
title?:string,
desc?:string,
url?:string    
}
```
- 普通事件接受数据字段类型定义
```typescript 
export type ApplicationEventContext = {
context:WechatApplication, 
send:Send,
material:Material,
consumer:Consumer,
toUser:string,
fromUser:string,
createTime:number,
msgType:MsgType,
scene: SceneType,
event:string,
eventKey?:string,
ticket?:string,
menuId?:string
}
```

- 消息类型定义
```typescript
export const enum MsgType{ 
TEXT, // 0
IMAGE, // 1
VOICE, // 2
VIDEO, // 3
EVENT,  // 4 
}


```

- 事件类型定义

```typescript
export const enum EventType {
SUBSCRIBE, //0 
UNSUBSCRIBE, // 1
SCAN , // 2 
MENU // 3 
}
```

## <span id="head30"> 支持</span>

- 欢迎 [issues](https://github.com/Changlon/koa-wechat-public/issues/new) 
- 作者联系邮箱: changlong.a2@gmail.com
- 可以给一波 Star !!! 有问题我们一起讨论，一起来完善这个框架
- 未来: 如果koa版本的库足够成熟，考虑再去适配其他web框架下的库，比如express!



