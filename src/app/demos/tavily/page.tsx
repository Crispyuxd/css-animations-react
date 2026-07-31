'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack, ThinkingTrace } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function TavilyDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="tavily-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          <UserMessage id="user-1" wrap>
            What are the top AI funding rounds this week?
          </UserMessage>

          <BotMessage
            id="bot-2"
            trace={<ThinkingTrace id="trace-1" />}
            lines={[
              'Here\'s what I found: Anthropic closed a $3.5B Series E at',
              'a $61.5B valuation, Mistral AI secured €600M in a Series',
              'B, and OpenAI is in talks for a $40B round at a $340B',
              'valuation.',
            ]}
            meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
          />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
