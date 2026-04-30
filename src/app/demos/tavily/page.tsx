'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function TavilyDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack gap={20}>
        <BotMessage id="bot-1" meta={<MetaRow id="meta-0" />}>
          Hey, how can I help?
        </BotMessage>

        <UserMessage id="user-1">
          What are the top AI funding rounds this week?
        </UserMessage>

        <BotMessage
          id="bot-2"
          lines={[
            'Here\'s what I found: Anthropic closed a $3.5B Series E at',
            'a $61.5B valuation, Mistral AI secured €600M in a Series',
            'B, and OpenAI is in talks for a $40B round at a $340B',
            'valuation.',
          ]}
          meta={<MetaRow id="meta-1" />}
        />
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
