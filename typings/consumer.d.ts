import { WechatApplication, WechatApplicationConfig } from ".";

export declare class  Consumer {

    app:WechatApplication
    
    constructor(app:WechatApplication) 

    /**获取关注者详细信息 */
    getUserDetail(openid:string):Promise<any>  

}