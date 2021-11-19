
export declare class  CryptoGraphyInterface {
    aesModel:string 
    token:string 
    appId:string 
    encodingAESKey:Buffer
    iv:Buffer

    msgSignature:string 
    timestamp:string  
    nonce:string 

    constructor(config?:{
        token:string 
        appId:string 
        encodingAESKey?:string 
        [k:string]:any
    })

    init(config:{
        msgSignature:string 
        timestamp:string  
        nonce:string

        token?:string 
        appId?:string 
        encodingAESKey?:string  
    }):CryptoGraphyInterface
    

    /** 解析xml加密数据 */ 
    decryptMsg(encryptMsg:string):any

    
    /** 数据转成xml */
    encryptMsg(xmlMsg:string) :string  
    

    /**PKCS7补位算法 */
    KCS7Encoder(textLength:number):string  
    

    /**解析xml到json对象 */
    parseXmlToJSON (xml:string):{[k:string]:any }  
    
    
    /**签名认证 */
    getMsgSignature(encryptMsg:string):string 


}