'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, ConnectedDivider, MessagesStack, ThinkingTrace } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function EscalationDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        {/* Two spacings, enforced by layout (no compensation math):
            • 20px inset from the chat-card edges (MessagesStack padding).
            • 32px between every message — composed as flex gap 20 +
              UserMessage's 12 vertical margins + divider's 12 vertical
              margins. MetaRow is in-flow (positioned={false} gap={8}) so it
              takes real flex height inside the bot block; this prevents
              meta from overlapping the message that follows. */}
        <div
          id="escalation-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          <UserMessage id="user-1">
            I&apos;m having trouble with my recent order
          </UserMessage>

          <BotMessage
            id="bot-2"
            trace={<ThinkingTrace id="trace-1" />}
            lines={[
              'I understand. Let me connect you with someone who can',
              'help directly.',
            ]}
            meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
          />

          <ConnectedDivider id="divider-1" name="Mark Kent Connected" style={{ marginTop: 12, marginBottom: 12 }} />

          <BotMessage id="bot-3" lines={['Thanks for waiting. How can I help?']} meta={<MetaRow id="meta-2" author="Mark Kent" positioned={false} gap={8} />} />

          <UserMessage id="user-2" wrap>
            My order was marked delivered but I never received it
          </UserMessage>

          <BotMessage id="bot-4" lines={['Let me pull up your order. Give me just a moment.']} meta={<MetaRow id="meta-3" author="Mark Kent" positioned={false} gap={8} />} />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
