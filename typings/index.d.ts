


import * as  Application from 'koa'  
import {Send}  from 'send'
import { CryptoGraphyInterface } from 'cryptog' 
import Promise from 'promise'
import { Material } from 'material'
import { Consumer } from 'consumer'




export const enum EventType {
    SUBSCRIBE,
    UNSUBSCRIBE,
    SCAN ,
    MENU
}


export const enum MsgType{ 
    TEXT,
    IMAGE, 
    VOICE,
    VIDEO,
    EVENT,  
}


export const enum SceneType {
    NORMAL = "normal" ,
    SCAN = "scan" 
}


export const enum PatternType { 
    STRING = "string" ,
    REGEXP = "regexp" 
}


export interface WechatApplicationConfig {
    [k:string]:any
}
export type Ctx = Application.BaseContext & Application.DefaultContext
export type Next = Application.Next 

export type Stack = { 
    type : MsgType , 
    handlers :  ((ctx:ApplicationCommonContext|ApplicationEventContext)=>any)[], 
    pattern ?:string | RegExp ,
    patternType?: PatternType ,
    eventType ? :EventType 
}

export type ApplicationCommonContext = {
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

export type ApplicationEventContext = {
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

export declare class WechatApplication {  

    config:WechatApplicationConfig  
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


    ctx : Ctx
    next: Next
    

    stack: Stack[]  
    crypto: CryptoGraphyInterface 

    constructor(config?:WechatApplicationConfig) 

    /**
     * 初始化配置
     * @param config 微信公众号配置参数 
     */
    init(config:WechatApplicationConfig):void 


    /**
     * 开启公众号 不需要通过 auth,handle方法判断请求GET，POST 
     */
    start():(ctx:Ctx,next?:Next)=>any
    

    /**
     * 公众号验证
     */
    auth():(ctx:Ctx,next?:Next)=>any


    /**
     * 生成处理数据中间件
     */
    handle():(ctx:Ctx,next?:Next)=>any 



    /**
     * 获取access_token
     */
    getAccessToken():Promise<string> 
     


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
    text(content:string | RegExp,handler:(acc:ApplicationCommonContext)=>any):WechatApplication  


    /**
     * 图片处理
     * @param hander 
     */
    image(hander:(acc:ApplicationCommonContext)=>any):WechatApplication 


    /**
     * 视频处理
     * @param hander 
     */
    video(handler:(acc:ApplicationCommonContext)=>any):WechatApplication  


    /**
     * 语音处理
     * @param handler 
     */
    voice(handler:(acc:ApplicationCommonContext)=>any):WechatApplication  


    
    /**
     * 用户关注公众号事件
     * @param acc 
     */
    subscribe(handler: (acc:ApplicationEventContext) => any):WechatApplication  


    /**
     * 用户取消关注公众号事件
     * @param acc 
     */
    unsubscribe(handler :(acc:ApplicationEventContext ) => any):WechatApplication  



    /**
     * 用户扫码进入场景事件
     * @param handler 
     */
    scan(handler :(acc:ApplicationEventContext ) => any):WechatApplication


    /**
     * 公众号菜单事件处理
     * @param handler 
     */
    menu(handler:(acc:ApplicationEventContext)=> any): WechatApplication 



    /**
     * 公众号网页授权信息处理
     * @param handler 
     */
    oauth(handler:(oauthData:{
            access_token:string,
            expires_in:number,
            refresh_token:string,
            openid:string,
            scope:string,
            state:string
    },ctx:Ctx)=>any) :WechatApplication  
    
}

