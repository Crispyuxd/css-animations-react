'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function SlackDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack gap={20}>
        <BotMessage id="bot-1" meta={<MetaRow id="meta-0" />}>
          Hey, how can I help?
        </BotMessage>

        <UserMessage id="user-1">
          Notify the sales team that the Acme deal closed
        </UserMessage>

        <BotMessage
          id="bot-2"
          lines={[
            'Done. I\'ve posted to #sales-team on Slack: "The Acme',
            'deal has just closed. Great work, team!" The message',
            'was delivered successfully.',
          ]}
          meta={<MetaRow id="meta-1" />}
        />
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
