import styles from './CallPanel.module.css';
import { CallEndIcon, CallMicIcon, UserCircleIcon } from '@/icons';
import { CALL_BAR_RATIOS } from '@/lib/call-waveform';

interface CallPanelProps {
  /** Must match the `voicecall` step's id — the engine derives every child
   *  selector from it (`{id}-dots`, `{id}-bars`, `{id}-cap-*`), plus `{id}-orb`,
   *  which is reserved rather than currently driven (see the orb below). */
  id: string;
  connectingLabel: string;
  talkingLabel: string;
}

/**
 * The call surface of the transfer-to-human flow: a 200px orb whose seven
 * units start as connect dots and become the voice waveform, a caption, and
 * the mute / end-call controls.
 *
 * This component is pure markup and rest state. All choreography lives in the
 * `voicecall` timeline step, which drives the two rows and the two captions by
 * id, including the resting oscillation of the waveform.
 *
 * Both rows stay mounted and overlap in the orb: the engine cuts one out on
 * the exact frame it cuts the other in, and at that frame both are seven
 * identical 8px black circles, so nothing is seen to change.
 */
export function CallPanel({ id, connectingLabel, talkingLabel }: CallPanelProps) {
  return (
    // Deliberately NOT wearing the engine's `messagesStack` cycle-fade hook.
    // That hook fades linearly and on this inner panel, whereas the entrance is
    // eased and lives on the #state-* wrapper — so wearing it gave this surface
    // two different fades, flat on the way out and eased on the way in. A
    // `surface: true` transition owns opacity at both ends instead, from the one
    // keyframe, which is what makes the exit the entrance mirrored.
    <div className={styles.panel}>
      <div className={styles.stage}>
        {/* The id is a RESERVED hook — nothing drives it today. It exists because
            an orb collapse (contracting to 0.86 as the surface leaves) was tried
            here and removed: the surface exit is the entrance mirrored, and the
            entrance has no orb movement to mirror. The orb is the surface's
            anchor and arrives on the surface's own rise.

            If that collapse ever returns, it must go on this id and NOT on a
            `data-enter` hook. That hook's selector is
            `#state-call [data-enter="n"]`, which outranks this bare `#{id}-orb`,
            and `animation` overrides wholesale rather than stacking — so a hook
            here silently replaces the collapse and it stops happening. */}
        <div id={`${id}-orb`} className={styles.orb}>
          {/* aria-hidden on both rows, matching the ported VoiceWaveform: they
              are empty spans conveying state that the caption already states in
              words. */}
          <div id={`${id}-dots`} className={styles.sound} aria-hidden>
            {CALL_BAR_RATIOS.map((_, i) => (
              <span key={i} data-dot className={styles.dot} />
            ))}
          </div>
          <div id={`${id}-bars`} className={styles.sound} aria-hidden>
            {CALL_BAR_RATIOS.map((ratio, i) => (
              <span
                key={i}
                data-bar
                className={styles.bar}
                style={{ ['--bar-ratio' as string]: String(ratio) }}
              />
            ))}
          </div>
        </div>

        {/* Fixed 20px slot so the two captions cross-fade in place instead of
            shifting the orb above them. */}
        {/* `data-enter` is the surface morph's staggered arrival: 1 controls
            (chrome, rides in with the card), 2 this caption slot (content, lands
            last). Only elements with no other transform/opacity animation of
            their own can carry the hook — the two captions animate their own
            opacity, this slot that wraps them does not. */}
        <div data-enter="2" className={styles.captions}>
          <p id={`${id}-cap-connecting`} className={styles.caption}>
            {connectingLabel}
          </p>
          <p id={`${id}-cap-talking`} className={styles.caption}>
            <UserCircleIcon />
            {talkingLabel}
          </p>
        </div>
      </div>

      <div data-enter="1" className={styles.controls}>
        <div className={styles.control} aria-hidden>
          <CallMicIcon />
        </div>
        <div className={`${styles.control} ${styles.end}`} aria-hidden>
          <CallEndIcon />
        </div>
      </div>
    </div>
  );
}
