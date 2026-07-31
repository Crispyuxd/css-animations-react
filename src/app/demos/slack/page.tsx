'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack, ThinkingTrace } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function SlackDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="slack-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          <UserMessage id="user-1">
            Notify the sales team that the Acme deal closed
          </UserMessage>

          {/* marginBottom trims the stack's 20 gap to the internal-to-turn 8 */}
          <ThinkingTrace id="trace-1" count={1} style={{ marginBottom: -12 }} />

          <BotMessage
            id="bot-2"
            lines={[
              'Done. I\'ve posted to #sales-team on Slack: "The Acme',
              'deal has just closed. Great work, team!" The message',
              'was delivered successfully.',
            ]}
            meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
          />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
