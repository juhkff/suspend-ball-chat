export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'wait';
    content: string;
    timestamp: number;
}
