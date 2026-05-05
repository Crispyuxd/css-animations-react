'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, ConnectedDivider, MessagesStack } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function EscalationDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

        <UserMessage id="user-1">
          I&apos;m having trouble with my recent order
        </UserMessage>

        <BotMessage
          id="bot-2"
          lines={[
            'I understand. Let me connect you with someone who can',
            'help directly.',
          ]}
          meta={<MetaRow id="meta-1" />}
        />

        <ConnectedDivider id="divider-1" name="Mark Kent Connected" />

        <BotMessage id="bot-3" lines={['Thanks for waiting. How can I help?']} meta={<MetaRow id="meta-2" author="Mark Kent" />} />

        <UserMessage id="user-2" wrap>
          My order was marked delivered but I never received it
        </UserMessage>

        <BotMessage id="bot-4" lines={['Let me pull up your order. Give me just a moment.']} meta={<MetaRow id="meta-3" author="Mark Kent" />} />
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
