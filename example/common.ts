const koa = require('koa') 
const Router = require('koa-router') 
const wechat = require('../src/lib/wechat').default 
const app_ = new koa() 
const wapp_ = new wechat({
    appId:"",
    appSecret:"",
    token:""
})
const router_ = new Router() 

module.exports = {
    app:app_,
    wapp:wapp_,
    router:router_
}