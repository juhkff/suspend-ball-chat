<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from "vue-property-decorator";
import {DEFAULT_DATE_TIME_FORMAT} from "@/constants/dateFormats"
import _ from 'lodash';
// 按需导入 Element UI 组件和样式
import {
  Button,
  Card,
  Divider,
  Input,
  Row,
  Col,
} from 'element-ui';
import {ChatMessage} from 'types';
// 按需导入样式
import 'element-ui/lib/theme-chalk/button.css';
import 'element-ui/lib/theme-chalk/card.css';
import 'element-ui/lib/theme-chalk/divider.css';
import 'element-ui/lib/theme-chalk/input.css';
import 'element-ui/lib/theme-chalk/row.css';
import 'element-ui/lib/theme-chalk/col.css';

@Component({
  name: 'chat-panel',
  components: {
    'el-row': Row,
    'el-col': Col,
    'el-card': Card,
    'el-divider': Divider,
    'el-input': Input,
    'el-button': Button,
  }
})
export default class ChatPanel extends Vue {
  @Prop({type: [String, Array], default: 'zh-CN'}) readonly locales!: string | string[];
  @Prop({
    type: Object, default: () => DEFAULT_DATE_TIME_FORMAT
  }) readonly options!: Intl.DateTimeFormatOptions;
  @Prop({type: String, default: 'http://localhost:8081/api/chat/v1/completion'}) readonly url!: string;

  constructor() {
    super();
    if (this.uiHistory.length === 0) {
      this.uiHistory.push({
        role: 'assistant',
        content: '你好，欢迎使用聊天机器人！请问有什么我可以帮助你的吗？',
        timestamp: Date.now()
      });
    }
  }

  private inputValue: string = 'aa'
  // uiHistory 提供UI界面展示数据. 因为存在一种情况：用户发送消息后，服务器返回错误，此时需要将用户消息和错误信息展示出来，但不存储到历史记录中
  private uiHistory: ChatMessage[] = []
  // 真正的历史记录
  private history: ChatMessage[] = []
  // 锁
  private locked: boolean = false;

  private sendChatMessage() {
    if (this.locked) {
      return;
    }
    this.locked = true;
    // copy防止用户改变inputValue导致存储内容变化
    const inputValueCopy = _.cloneDeep(this.inputValue);
    this.inputValue = '';
    if (!inputValueCopy.trim()) {
      return;
    }
    const fetchPromise = fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: this.history,
        message: inputValueCopy
      })
    })
    // 要有先后顺序，UI的回复前处理必须先于请求结果处理
    const uiPromise = new Promise<NodeJS.Timeout>(resolve => {
      const thinkingTemplate = ['thinking', 'thinking.', 'thinking..', 'thinking...'];
      let seconds = 0;
      this.uiHistory.push({
        role: 'user',
        content: inputValueCopy,
        timestamp: Date.now()
      });
      // 思考效果
      this.uiHistory.push({
        role: 'wait',
        content: 'thinking...',
        timestamp: -1,
      });
      // 定时器模拟思考时间
      const timer = setInterval(() => {
        this.uiHistory[this.uiHistory.length - 1].content = thinkingTemplate[seconds++ % thinkingTemplate.length];
      }, 500);
      resolve(timer);
    });
    Promise.all([uiPromise, fetchPromise]).then(async ([timer, response]) => {
      // await new Promise(resolve => {
      //   setTimeout(resolve, 5000);
      // });
      clearTimeout(timer);
      this.uiHistory.pop();
      const data = await response.json();
      if (response.ok) {
        // 成功才存储对话内容
        this.history.push({
          role: 'user',
          content: inputValueCopy,
          timestamp: Date.now()
        });
        [this.uiHistory, this.history].forEach(arrayObj => {
          arrayObj.push({
            role: 'assistant',
            content: data.message,
            timestamp: Date.now()
          });
        });
      } else {
        // this.$message.error(data.message);
        this.uiHistory.push({
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        });
      }
    }).catch(error => {
      // this.$message.error(error.message);
      this.uiHistory.push({
        role: 'wait',
        content: error.message,
        timestamp: Date.now()
      })
    }).finally(() => {
      this.locked = false;
    })
  }

  private onEnter(event: KeyboardEvent) {
    if (!event.ctrlKey) {
      event.preventDefault();
      this.sendChatMessage();
    } else {
      // ctrl + enter 换行
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      this.inputValue =
          this.inputValue.substring(0, start) +
          '\n' +
          this.inputValue.substring(end);
      this.$nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
      event.preventDefault();
    }
  }

  private onTab(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    this.inputValue =
        this.inputValue.substring(0, start) +
        '\t' +
        this.inputValue.substring(end);
    this.$nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    });
    event.preventDefault();
  }
}
</script>

<template>
  <div>
    <el-row style="flex-direction: column;">
      <el-col v-for="(item, index) in this.uiHistory" :key="index" :class="`card-col ${item.role}`">
        <el-card :class="`message-card ${item.role}`">
          <el-row v-if="item.role !== 'wait'" :class="`card-panel-timestamp ${item.role}`" type="flex"
                  v-text="new Date(item.timestamp).toLocaleString(locales, options)"/>
          <el-row :class="`message-content ${item.role}`" type="flex" justify="start" v-text="item.content"/>
        </el-card>
      </el-col>
    </el-row>
    <el-divider class="input-top-divider"/>
    <el-card class="input-card">
      <slot>
        <el-input type="textarea" autosize clearable resize="none" style="flex: 1" class="card-input"
                  placeholder="Type your message here..." @keydown.enter.native="onEnter" @keydown.tab.native="onTab"
                  v-model="inputValue"/>
        <el-button @click="sendChatMessage" class="ball-chat-submit" circle="circle" size="small"
                   style="background: transparent; border: none;">
          <!-- 发送箭头 SVG 图标 -->
          <svg style="width: 16px; height: 16px; display: flex; align-items: center;" viewBox="0 0 24 24"
               fill="currentColor">
            <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
          </svg>
        </el-button>
      </slot>
    </el-card>
  </div>
</template>

<style scoped>
.message-card {
  width: fit-content;
  border-radius: 10px;
  padding: 2px;
  margin: 5px;
  font-size: 14px;
}

.message-card ::v-deep .el-card__body {
  padding: 5px 10px;
}

.message-card.user {
  margin-right: 5%;
}

.message-card.assistant,
.message-card.wait {
  background-color: #4E8CFF;
  margin-left: 5%;
}

.card-col {
  display: flex;
}

.card-col.user {
  justify-content: flex-start;
}

.card-col.assistant,
.card-col.wait {
  justify-content: flex-end;
}

.card-panel-timestamp {
  margin-bottom: 5px;
  color: gray;
  font-size: 12px;
}

.card-panel-timestamp.user {
  justify-content: flex-start;
}

.card-panel-timestamp.assistant,
.card-panel-timestamp.wait {
  justify-content: flex-end;
  color: #d9d9d9;
}

.input-top-divider {
  margin-top: 10px;
  margin-bottom: 10px;
}

.input-card {
  margin: 10px;
  background-color: #f2f5f7;
  border-radius: 10px;
}

.input-card ::v-deep .el-card__body {
  padding: 0 5px 0 15px;
  display: flex;
  justify-content: flex-start;
}

.card-input {
  display: flex;
  align-items: center;
}

.card-input ::v-deep .el-input__inner {
  padding: 0;
}

.card-input ::v-deep .el-textarea__inner {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-color: transparent;
  padding: 0;
  border: none;
}

.message-content {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  display: flex;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0;
  text-align: left;
  text-indent: 0;
}

.message-content.assistant,
.message-content.wait {
  color: white;
}
</style>
