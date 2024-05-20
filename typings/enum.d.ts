

//事件类型
export const enum EventType {
    SUBSCRIBE,
    UNSUBSCRIBE,
    SCAN ,
    MENU
}


//消息类型
export const  enum MsgType{ 
    TEXT = "text",
    IMAGE = "image", 
    VOICE = "voice",
    VIDEO = "video",
    EVENT = "event",  
}

//进入场景类型
export  const enum SceneType {
    NORMAL = "normal" ,
    SCAN = "scan" 
}

//匹配类型
export  const enum PatternType { 
    STRING = "string" ,
    REGEXP = "regexp" 
}