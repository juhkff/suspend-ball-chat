import Vue from "vue";
import ChatPanel from "./chat-panel";
import SuspendBallChat from "./suspend-ball-chat";

const components: { [propsName: string]: any } = {
    'chat-panel': ChatPanel,
    'suspend-ball-chat': SuspendBallChat,
};

const install = (vue: typeof Vue): void => {
    // 安装全部的插件
    Object.keys(components).forEach((key) => {
        vue.component(key, components[key]);
    });
};

// 自动安装
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

export {
    install,
    ChatPanel,
    SuspendBallChat,
};

export default {
    install,
    ChatPanel,
    SuspendBallChat,
}
