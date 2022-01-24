
import 'mocha'
import {expect} from 'chai'
import WechatPublic from '../src/lib/wechat' 
import Send from '../src/lib/send'
import { Material } from '../src/lib/material'
import { Consumer } from '../src/lib/consumer'

describe("测试主模块",()=>{  
    
    describe("构造函数初始化",()=>{
        it("实例config中 appId,appSecret,token为空则抛出异常",()=>{    
            expect(()=>{
                new WechatPublic({
                    appId:undefined,
                    appSecret:undefined,
                    token:undefined
                })
            }).to.throw(Error) 
        })

        it("实例中有send,material,consumer模块",()=>{ 
            const wechat = new WechatPublic({
                appId:"appid",
                appSecret:"appSecret",
                token:"token"
            })

            expect(wechat.send).to.be.instanceOf(Send)
            expect(wechat.material).to.be.instanceOf(Material)
            expect(wechat.consumer).to.be.instanceOf(Consumer)
        })

    })
   

    describe("实例中有消息模块中的所有客服接口方法",() =>{ 
        const wechat = new WechatPublic({
            appId:"wx3ace0c0fa2f4cab0",
            appSecret:"8ea32e13460637765fb65a5e48b7c023",
            token:"changlon"
        }) 
        
        it("实例 pushTxtCustomerMsg 方法",() =>{
            expect(typeof wechat.pushTxtCustomerMsg).to.be.equal("function")  
        })
        it("实例 pushImageCustomerMsg 方法",() =>{
            expect(typeof wechat.pushImageCustomerMsg).to.be.equal("function")  
        })

        it("实例 pushVideoCustomerMsg 方法",() =>{
            expect(typeof wechat.pushVideoCustomerMsg).to.be.equal("function")  
        })


        it("实例 pushMiniProgramCardMsg 方法",() =>{
            expect(typeof wechat.pushMiniProgramCardMsg).to.be.equal("function")  
        })

        it("实例 pushTemplateMsg 方法",() =>{
            expect(typeof wechat.pushTemplateMsg).to.be.equal("function")  
        })

        it("实例 addTmpMaterial 方法",() =>{
            expect(typeof wechat.addTmpMaterial).to.be.equal("function")  
        })

        it("实例 addLongTimeMaterial 方法",() =>{
            expect(typeof wechat.addLongTimeMaterial).to.be.equal("function")  
        })

        it("实例 removeLongTimeMaterial 方法",() =>{
            expect(typeof wechat.removeLongTimeMaterial).to.be.equal("function")  
        })
        
    })


})


