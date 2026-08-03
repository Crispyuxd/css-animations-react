'use client';

import {
  ChatCard,
  ChatHeader,
  ChatInput,
  MessagesStack,
  BotMessage,
  UserMessage,
  MetaRow,
  ThinkingTrace,
  CallPanel,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function TransferToHumanDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />

      {/* Figma draws the three states as three separate 406x732 cards; here
          they are one card whose body is exchanged. Both states are absolutely
          positioned in the 668px box below the header so the swap cannot
          reflow or resize either of them. */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          id="state-chat"
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
        >
          <MessagesStack>
            {/* gap 20 + UserMessage's 12/12 margins = the 32 between events.
                See docs/CHAT_LAYOUT.md. */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
            >
              {/* marginTop 0 because this bubble is the first event in the
                  stack: its default 12px top margin would seat it 32 below the
                  messages edge, where Figma has it at the 20px inset that
                  MessagesStack's padding already provides. */}
              <UserMessage id="user-1" style={{ marginTop: 0 }}>
                I need human assistance
              </UserMessage>

              {/* Line breaks are Figma's own wrap of the 334px text node, kept
                  verbatim. So is "with assist" in the third line, which is a
                  typo in the design copy. */}
              <BotMessage
                id="bot-1"
                trace={<ThinkingTrace id="trace-1" />}
                lines={[
                  'I understand you’d prefer to speak with a human',
                  'agent. I’m arranging that connection for you now,',
                  'and a human representative with assist you shortly.',
                ]}
                meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
              />
            </div>
          </MessagesStack>
          <ChatInput />
        </div>

        {/* opacity 0 is the pre-timeline rest state; the transition step's
            generated keyframe takes over from there. */}
        <div id="state-call" style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <CallPanel
            id="call"
            connectingLabel="Calling customer support..."
            talkingLabel="Talking to Alex James"
          />
        </div>
      </div>
    </ChatCard>
  );
}
