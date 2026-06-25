// AI助手页面
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Tag, Typography, Spin, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 调用AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是AI产品运营助手，专门帮助产品经理和运营人员分析数据、处理反馈、监控制品、生成周报。请用专业、简洁、有洞察的方式回答问题。'
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('AI服务暂时不可用');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              aiResponse += content;

              setMessages(prev => prev.map(m =>
                m.id === aiMessage.id
                  ? { ...m, content: aiResponse }
                  : m
              ));
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      message.error('AI服务暂时不可用，请稍后重试');
      console.error('AI错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
  };

  // 快捷问题
  const quickQuestions = [
    '上周DAU是多少？',
    '用户反馈的主要问题是什么？',
    '生成本周运营周报',
    '如何提升用户留存？',
    '竞品最近有什么动态？'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>🤖 AI助手</Typography.Title>
        <Text type="secondary">用自然语言查询数据、生成报告、获取洞察</Text>
      </div>

      {/* 快捷问题 */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>快捷问题：</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quickQuestions.map((question, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => setInputValue(question)}
            >
              {question}
            </Tag>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      <Card
        style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: 16,
          background: '#fafafa'
        }}
        bodyStyle={{ padding: 16 }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RobotOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
            <div>
              <Text strong>欢迎使用AI助手</Text>
            </div>
            <div>
              <Text type="secondary">你可以问我任何关于产品运营的问题</Text>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16
                }}
              >
                <div
                  className={msg.role === 'user' ? 'user-message' : 'ai-message'}
                  style={{ maxWidth: '80%' }}
                >
                  <div style={{ marginBottom: 4 }}>
                    {msg.role === 'user' ? (
                      <UserOutlined style={{ marginRight: 8 }} />
                    ) : (
                      <RobotOutlined style={{ marginRight: 8 }} />
                    )}
                    <Text strong style={{ color: msg.role === 'user' ? '#333' : '#fff' }}>
                      {msg.role === 'user' ? '你' : 'AI助手'}
                    </Text>
                  </div>
                  <Paragraph
                    style={{
                      margin: 0,
                      color: msg.role === 'user' ? '#333' : '#fff',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content || (loading && msg.id === messages[messages.length - 1]?.id ? '思考中...' : '')}
                  </Paragraph>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* 输入区域 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          icon={<ClearOutlined />}
          onClick={handleClear}
          disabled={messages.length === 0}
        >
          清空
        </Button>
        <TextArea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="输入你的问题...（按Enter发送，Shift+Enter换行）"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={e => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!inputValue.trim()}
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default AiAssistantPage;
