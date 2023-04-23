
import koa from 'koa'
import koaRouter from 'koa-router'
import koaXmlBody from 'koa-xml-body'
import WechatApplication from "../src/lib/wechat"  

const weapp = new WechatApplication({
    appId:"APPID",
    appSecret:"SECRET",
    token:"TOKEN"
})

var OPENID
weapp.text("debug",async acc =>{
    OPENID = acc.fromUser
    acc.send.sendTxtMsg("debuging...")    
})

const Service = new koa() 
const Router = new koaRouter() 


Router.all(`/wechat_debug`,weapp.start()) 
Router.all(`/debug`,async (ctx,next)=>{ 
       const debugFuncName =  ctx.query.func  || "pushTxtCustomerMsg"  
       const openid = ctx.query.openid 
       const content = ctx.query.content
        console.log(debugFuncName,openid,content)
        const debugTarget = weapp[`${debugFuncName}`]  
        const res = await debugTarget(openid,content) 
        console.log(res)       
})


Service.use(koaXmlBody())
Service.use(Router.routes()) 
Service.listen(3001) 


