'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function CustomActionsDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack gap={20}>
        <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

        <UserMessage id="user-1">
          Check my account status
        </UserMessage>

        <BotMessage
          id="bot-2"
          lines={[
            'Your account is active and in good standing. Your current',
            'plan renews on May 1, 2025.',
          ]}
          meta={<MetaRow id="meta-1" />}
        />
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
