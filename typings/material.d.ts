

/**
 * 素材管理接口
 */

import { WechatApplication } from ".";

export  declare class Material { 


    app:WechatApplication 
    
    constructor(ctx:WechatApplication) 
    
    //新增临时素材 
    addTmpMaterial(localPath:string,type:string):Promise<any>

    //新增永久素材
    addLongTimeMaterial(localPath:string,type:string,desc?:{[k:string]:any}):Promise<any>
    
    //删除永久素材
    removeLongTimeMaterial(mediaId:string):Promise<any>
    

}

