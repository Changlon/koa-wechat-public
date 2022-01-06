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

    setTimeout(()=>{
        for(let i = 0;i<4;i++) {

            acc.send.pushTemplateMsg(acc.fromUser,"z607o0lv86kSOUtudqAszoAW8HOcmV3ZjFu7JDwCjDE",{
                title:{
                    value:"支付提醒",
                    color:"#173177"
                },
                content:{
                    value:"续费vip享8折优惠",
                    color:"#173117"
                }
            },"http://www.baidu.com","#FF0000")
        }
    },3000)

})

rt.all("/wechat_dev",wap.start()) 


ap.use(xmlP())
ap.use(rt.routes())  
ap.listen(3001)
