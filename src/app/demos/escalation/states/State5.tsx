import { ChatCard, ChatHeader, ChatInput, UserMessage, MessagesStack } from '@/components';

// State 5 — User-2 message anchored at the top (~12s, post user-2 anchor).
// Visible: user-2 only. The entire prior turn (bot-2 → meta-2) has scrolled
// above the viewport as one block.
export function State5() {
  return (
    <>
      <style>{`
        #s5-user-2 { opacity: 1 !important; transform: none !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s5-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <UserMessage id="s5-user-2" wrap>
              My order was marked delivered but I never received it
            </UserMessage>
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
