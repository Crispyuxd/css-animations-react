import { MetaRow } from '../MetaRow/MetaRow';

interface DemoStateProps {
  id: string;
  /** Stack on top of an in-flow sibling state instead of taking layout space */
  overlay?: boolean;
  /** Optional MetaRow id rendered at the bottom of the state */
  metaId?: string;
  /** Right padding to leave room for the meta row anchor (default 32 to match Figma) */
  paddingRight?: number;
  /** Override the gap between the widget and the MetaRow (default 8 from .positioned) */
  metaGap?: number;
  children: React.ReactNode;
}

export function DemoState({ id, overlay = false, metaId, paddingRight = 32, metaGap, children }: DemoStateProps) {
  const style: React.CSSProperties = overlay
    ? { opacity: 0, paddingRight, position: 'absolute', top: 0, left: 0, right: 0 }
    : { paddingRight };

  return (
    <div id={id} style={style}>
      {children}
      {metaId && <MetaRow id={metaId} gap={metaGap} />}
    </div>
  );
}
