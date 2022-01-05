
const {
    app,
    wapp,
    router
} = require('./common') 

const xmlParser = require ('koa-xml-body') 

wapp.oauth(async function handler(data,ctx) {  
    const openid = data.openid 
    ctx.response.redirect('http://www.baidu.com?openid='+openid)    
})

router.all('/wechat_dev',wapp.start()) 

router.get('/MP_verify_Mi8hQs3epYmV9Q5G.txt',async ctx =>{ 
    ctx.body = `授权凭证`
})

app.use(xmlParser())
app.use(router.routes()) 
app.listen(3001)
