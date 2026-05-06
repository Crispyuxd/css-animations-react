import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack } from '@/components';

// State 3 — Bot-2 reply complete (~6s into cycle).
// Visible: user-1 (anchored at top), bot-2 fully typed (2 lines), meta-1.
export function State3() {
  return (
    <>
      <style>{`
        #s3-user-1 { opacity: 1 !important; transform: none !important; }
        #s3-bot-2,
        #s3-bot-2-line-1,
        #s3-bot-2-line-2 { clip-path: inset(0 0 0 0) !important; padding-right: 0 !important; }
        #s3-meta-1 { opacity: 1 !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s3-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <UserMessage id="s3-user-1">
              I&apos;m having trouble with my recent order
            </UserMessage>

            <BotMessage
              id="s3-bot-2"
              lines={[
                'I understand. Let me connect you with someone who can',
                'help directly.',
              ]}
              meta={<MetaRow id="s3-meta-1" />}
            />
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
