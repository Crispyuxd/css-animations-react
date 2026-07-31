'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack, ThinkingTrace } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function CustomActionsDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="custom-actions-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          <UserMessage id="user-1">
            Check my account status
          </UserMessage>

          <BotMessage
            id="bot-2"
            trace={<ThinkingTrace id="trace-1" />}
            lines={[
              'Your account is active and in good standing. Your current',
              'plan renews on May 1, 2025.',
            ]}
            meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
          />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
