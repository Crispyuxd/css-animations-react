import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, ConnectedDivider, MessagesStack } from '@/components';

// State 4 — Mark Kent connected, bot-3 reply complete (~9s into cycle).
// Visible: user-1 (anchored), bot-2 + meta-1, divider, bot-3 + meta-2.
// This is the busiest visible state — a full conversation context window.
export function State4() {
  return (
    <>
      <style>{`
        #s4-user-1 { opacity: 1 !important; transform: none !important; }
        #s4-bot-2,
        #s4-bot-2-line-1,
        #s4-bot-2-line-2 { clip-path: inset(0 0 0 0) !important; padding-right: 0 !important; }
        #s4-meta-1 { opacity: 1 !important; }
        #s4-divider-1 { opacity: 1 !important; }
        #s4-bot-3, #s4-bot-3-line-1 { clip-path: inset(0 0 0 0) !important; padding-right: 0 !important; }
        #s4-meta-2 { opacity: 1 !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s4-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <UserMessage id="s4-user-1">
              I&apos;m having trouble with my recent order
            </UserMessage>

            <BotMessage
              id="s4-bot-2"
              lines={[
                'I understand. Let me connect you with someone who can',
                'help directly.',
              ]}
              meta={<MetaRow id="s4-meta-1" />}
            />

            <ConnectedDivider id="s4-divider-1" name="Mark Kent Connected" style={{ marginTop: 24 }} />

            <BotMessage
              id="s4-bot-3"
              lines={['Thanks for waiting. How can I help?']}
              meta={<MetaRow id="s4-meta-2" author="Mark Kent" />}
            />
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
