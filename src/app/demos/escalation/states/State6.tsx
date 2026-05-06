import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack } from '@/components';

// State 6 — Bot-4 final reply (~15s into cycle, end-of-cycle hold).
// Visible: user-2 (anchored), bot-4 fully typed, meta-3.
// This is what the viewer sees during the long final hold before loop wrap.
export function State6() {
  return (
    <>
      <style>{`
        #s6-user-2 { opacity: 1 !important; transform: none !important; }
        #s6-bot-4, #s6-bot-4-line-1 { clip-path: inset(0 0 0 0) !important; padding-right: 0 !important; }
        #s6-meta-3 { opacity: 1 !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s6-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <UserMessage id="s6-user-2" wrap>
              My order was marked delivered but I never received it
            </UserMessage>

            <BotMessage
              id="s6-bot-4"
              lines={['Let me pull up your order. Give me just a moment.']}
              meta={<MetaRow id="s6-meta-3" author="Mark Kent" />}
            />
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
