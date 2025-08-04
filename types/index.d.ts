import { ChatPanel } from "./components/chat-panel";
import { SuspendBallChat } from "./components/suspend-ball-chat";
import { ChatMessage } from "./common";


// 安装全部的插件
export declare function install(Vue: typeof import("vue").default): void;

export {
    install,
    ChatMessage,
    ChatPanel,
    SuspendBallChat
};
