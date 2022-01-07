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

    setTimeout(async ()=>{
        for(let i = 0;i<1;i++) {

        const res = await acc.send.pushTemplateMsg(acc.fromUser,"z607o0lv86kSOUtudqAszoAW8HOcmV3ZjFu7JDwCjDE",{
                title:{
                    value:"支付提醒",
                    color:"#173177"
                },
                content:{
                    value:"续费vip享8折优惠",
                    color:"#173117"
                }
            },"http://www.baidu.com",{
                // appid:"wx67c3a8e87ca5bae0",
                // pagepath:"pages/index/index" 
            })

            console.log(res)
        }

    },3000)
    
})

rt.all("/wechat_dev",wap.start()) 


ap.use(xmlP())
ap.use(rt.routes())  
ap.listen(3001)
