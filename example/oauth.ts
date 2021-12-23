const koa = require('koa') 
const Router = require('koa-router') 
const xmlParser = require ('koa-xml-body') 
const wechat = require('../src/lib/wechat').default 

const app = new koa() 

const wapp = new wechat({
    appId:"appid",
    appSecret:"secret",
    token:"token"
})

// wapp.oauth(async function handler(data,ctx) {  
//     const openid = data.openid 
//     ctx.response.redirect('http://www.baidu.com?openid='+openid)    
// })

wapp.text('客服', async  acc =>{ 
    console.log(acc.msgId)
    console.log(acc)
    await new Promise(r=>{
        setTimeout(()=>{
            r(1)
        },1000 * 5)
    })
})

const router = new Router() 
router.all('/wechat_dev',wapp.start()) 
router.get('/MP_verify_Mi8hQs3epYmV9Q5G.txt',async ctx =>{ 
    ctx.body = `授权凭证`
})

app.use(xmlParser())
app.use(router.routes()) 
app.listen(3001)
