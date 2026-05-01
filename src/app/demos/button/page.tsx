'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  CTAButton, DebugScrubber,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function ButtonDemo() {
  useTimeline(timeline);

  return (
    <>
      <ChatCard>
        <ChatHeader />
        <MessagesStack gap={20}>
          <BotMessage id="bot-1" meta={<MetaRow id="meta-0" />}>
            Hey, how can I help?
          </BotMessage>

          <UserMessage id="user-1">Can you redirect me to pricing page?</UserMessage>

          <BotMessage
            id="bot-2"
            slot={<CTAButton id="btn-pricing">Visit our pricing page</CTAButton>}
            meta={<MetaRow id="meta-1" gap={12} />}
          >
            Sure, please click on this button:
          </BotMessage>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
      <DebugScrubber />
    </>
  );
}
