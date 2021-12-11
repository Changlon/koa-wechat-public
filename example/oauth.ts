const koa = require('koa') 
const Router = require('koa-router') 
const xmlParser = require ('koa-xml-body') 
const wechat = require('../src/lib/wechat').default 

const app = new koa() 

const wapp = new wechat({
    appId:"APPID",
    appSecret:"APPSECRET",
    token:"TOEKN",
    encodingAESKey:"ENCODINGAESKEY"
})

wapp.oauth(async function handler(data,ctx) {  
    const openid = data.openid 
    ctx.response.redirect('http://www.baidu.com?openid='+openid)    
})



const router = new Router() 
router.all('/wechat',wapp.start()) 
router.get('/MP_verify_Mi8hQs3epYmV9Q5G.txt',async ctx =>{ 
    ctx.body = `授权凭证`
})

app.use(xmlParser())
app.use(router.routes()) 
app.listen(3001)
