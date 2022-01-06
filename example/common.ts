const koa = require('koa') 
const Router = require('koa-router') 
const wechat = require('../src/lib/wechat').default 
const app_ = new koa() 
const wapp_ = new wechat({
    appId:"wx3ace0c0fa2f4cab0",
    appSecret:"8ea32e13460637765fb65a5e48b7c023"
})
const router_ = new Router() 

module.exports = {
    app:app_,
    wapp:wapp_,
    router:router_
}