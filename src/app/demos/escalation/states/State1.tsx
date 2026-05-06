import { ChatCard, ChatHeader, ChatInput, BotMessage, MetaRow, MessagesStack } from '@/components';

// State 1 — AI bot greeting (initial state, ~1.5s into cycle).
// Visible: bot-1 text fully revealed, meta-0 ("Just now" + thumbs).
export function State1() {
  return (
    <>
      <style>{`
        #s1-bot-1, #s1-bot-1-line-1 { clip-path: inset(0 0 0 0) !important; padding-right: 0 !important; }
        #s1-meta-0 { opacity: 1 !important; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="s1-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <BotMessage id="s1-bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="s1-meta-0" />} />
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
