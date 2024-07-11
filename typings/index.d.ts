
import * as  Application from 'koa'  
import {Send}  from './send'
import { CryptoGraphyInterface } from './cryptog' 
import { Material } from './material'
import { Consumer } from './consumer'
import { EventType, MsgType , PatternType, SceneType } from './enum'




 declare class WechatApplication {  
    config:WechatApplication.WechatApplicationConfig  
    token : string
    appId: string
    appSecret:string
    encodingAESKey?:string

    apiDomain:string
    apiUrl:{
        [key:string]:any
    }
    miniConfig?:{
        [key:string]:any 
    } 

    send:Send 
    material:Material 
    consumer:Consumer 

    ctx :WechatApplication.Ctx
    next: WechatApplication.Next
    

    stack: WechatApplication.Stack[]  
    crypto: CryptoGraphyInterface 
   
    accessTokenCache:{
        access_token:string,
        expires_time:number,
        expires_in:number
    }

    constructor(config:WechatApplication.WechatApplicationConfig) 

    /**
     * 初始化配置
     * @param config 微信公众号配置参数 
     */
    init(config:WechatApplication.WechatApplicationConfig):void 


    /**
     * 开启公众号 不需要通过 auth,handle方法判断请求GET，POST 
     */
    start():(ctx:WechatApplication.Ctx,next?:WechatApplication.Next)=>any
    

    /**
     * 公众号验证
     */
    auth():(ctx:WechatApplication.Ctx,next?:WechatApplication.Next)=>any


    /**
     * 生成处理数据中间件
     */
    handle():(ctx:WechatApplication.Ctx,next?:WechatApplication.Next)=>any 



    /**
     * 获取access_token
     */
    getAccessToken():Promise<string> 
     
    /**
     * 设置access_token
     * @param access_token 
     * @param expires_in 
     */
    setAccessToken(access_token:string,expires_in:number) :void 
    

    /**
     * 检测access_token
     */
    checkAccessToken():Promise<boolean>


    /**
     * 创建公众号菜单
     * @param menuViews 
     */
    createMenu(menuViews:{[k:string]:any}):WechatApplication




    /**
     * 文本处理
     * @param name 
     * @param handler 
     */
    text(content:string | RegExp,handler:(acc:WechatApplication.ApplicationCommonContext)=>any):WechatApplication  


    /**
     * 图片处理
     * @param hander 
     */
    image(hander:(acc:WechatApplication.ApplicationCommonContext)=>any):WechatApplication 


    /**
     * 视频处理
     * @param hander 
     */
    video(handler:(acc:WechatApplication.ApplicationCommonContext)=>any):WechatApplication  


    /**
     * 语音处理
     * @param handler 
     */
    voice(handler:(acc:WechatApplication.ApplicationCommonContext)=>any):WechatApplication  


    
    /**
     * 用户关注公众号事件
     * @param acc 
     */
    subscribe(handler: (acc:WechatApplication.ApplicationEventContext) => any):WechatApplication  


    /**
     * 用户取消关注公众号事件
     * @param acc 
     */
    unsubscribe(handler :(acc:WechatApplication.ApplicationEventContext ) => any):WechatApplication  



    /**
     * 用户扫码进入场景事件
     * @param handler 
     */
    scan(handler :(acc:WechatApplication.ApplicationEventContext ) => any):WechatApplication


    /**
     * 公众号菜单事件处理
     * @param handler 
     */
    menu(handler:(acc:WechatApplication.ApplicationEventContext)=> any): WechatApplication 



    /**
     * 公众号网页授权信息处理
     * @param handler 
     */
    oauth(handler:(oauthData:{
            msgType:string,
            event:string,
            access_token:string,
            expires_in:number,
            refresh_token:string,
            openid:string,
            scope:string,
            state:string
    },ctx:WechatApplication.Ctx,next:WechatApplication.Next)=>any) :WechatApplication  
    
}



declare namespace WechatApplication {

    
    type Ctx = Application.BaseContext & Application.DefaultContext
    type Next = Application.Next   
    type Incomming_MsgType = MsgType 
    type Incomming_EventType = EventType



    type WechatApplicationConfig  = {
        appId:string, 
        appSecret:string,
        token:string,
        encodingAESKey?:string,
        miniConfig?:{
            title:string,
            appId:string,
            pagePath:string,
            thumbMediaId:string 
        },
        apiDomain?:string,
        apiUrl?:{[k:string]:any},
        xmlKey?:string,
        redis?:{
            port: number,
            host: string,
            username?:string
            password?: string,
            db?: number,
        }
        
        [k:string]:any
     }
    

    type Stack = { 
        type : MsgType , 
        handlers :  ((ctx:ApplicationCommonContext|ApplicationEventContext)=>any)[], 
        pattern ?:string | RegExp ,
        patternType?: PatternType ,
        eventType ? :EventType 
    }

     type ApplicationCommonContext = {
        context:WechatApplication,
        send:Send,
        material:Material,
        consumer:Consumer,
        toUser:string,
        fromUser:string,
        msgType:MsgType,
        createTime:number,
        msgId:string,
        content?:string,
        picUrl?:string,
        mediaId?:string, 
        format?:any, 
        thumbMediaId?:string
        locX?:number,
        locY?:number,
        scale?:number,
        label?:string,
        title?:string,
        desc?:string,
        url?:string    
    }

     type ApplicationEventContext = {
        context:WechatApplication, 
        send:Send,
        material:Material,
        consumer:Consumer,
        toUser:string,
        fromUser:string,
        createTime:number,
        msgType:MsgType,
        scene: SceneType,
        event:string,
        eventKey?:string,
        ticket?:string,
        menuId?:string
    }
}



export =  WechatApplication