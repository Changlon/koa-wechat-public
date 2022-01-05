const xmlP = require('koa-xml-body') 

const {
    app:ap,
    wapp:wap,
    router:rt
} = require('./common') 


wap.text('text',async acc =>{
    await acc.send.sendTxtMsg("Text") 
    await acc.send.pushTxtCustomerMsg(acc.fromUser,"pushText") 
    console.log(acc.context.accessTokenCache) 

})

rt.all("/wechat_dev",wap.start()) 


ap.use(xmlP())
ap.use(rt.routes())  
ap.listen(3001)
