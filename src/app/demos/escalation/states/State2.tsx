import { ChatCard, ChatHeader, ChatInput, UserMessage, MessagesStack } from '@/components';

// State 2 — User-1 message anchored at the top (~3.5s, post user-1 anchor).
// Visible: user-1 only. bot-1 + meta-0 have scrolled above the viewport.
export function State2() {
  return (
    <>
      <style>{`
        #s2-user-1 { opacity: 1 !important; transform: none !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s2-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <UserMessage id="s2-user-1">
              I&apos;m having trouble with my recent order
            </UserMessage>
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
