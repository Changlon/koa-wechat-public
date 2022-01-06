
import WechatApplication,{ Ctx } from "."

/**
 * 消息管理接口
 */
export  declare class Send { 
    app:WechatApplication
    ctx:Ctx
    fromUser:string
    toUser:string
  
    constructor(ctx:WechatApplication,fromUser:string,toUser:string)

    /** 自动回复文本类型消息 */
    sendTxtMsg(content:string):any 


    /** 自动回复图片类型的消息 */
    sendImageMsg(mediaId:string):any  


    /**自动回复视频 */
    sendVideoMsg(mediaId:string,title?:string,desc?:string):any 
        

    /**发送客服文本消息 */
    pushTxtCustomerMsg(toUser:string,content:string):Promise<any> 


    /**发送客服图片消息 */
    pushImageCustomerMsg(toUser:string,mediaId:string) :Promise<any> 


    /** 发送客服视频消息 */
    pushVideoCustomerMsg(toUser:string,mediaId:string,thumbMediaId?:string,title?:string,desc?:string) :Promise<any> 
    
    /**发送小程序卡片 */
    pushMiniProgramCardMsg(toUser:string,params?:{[k:string]:any},miniConfig?:{
        title:string,
        appId:string,
        pagePath:string,
        thumbMediaId:string
    }):Promise<any>
    
    /** 推送模板消息 */
    pushTemplateMsg(toUser:string,templateId:string,data?:{[k:string]:any},url?:string,topcolor?:string)   

    
} 