import styles from './CallPanel.module.css';
import { CallEndIcon, CallMicIcon, UserCircleIcon } from '@/icons';
import { CALL_BAR_RATIOS } from '@/lib/call-waveform';

interface CallPanelProps {
  /** Must match the `voicecall` step's id — the engine derives every child
   *  selector from it (`{id}-dots`, `{id}-bars`, `{id}-cap-*`). */
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
    // `messagesStack` is the engine's cycle fade hook (it carries no styles of
    // its own). Without it the call surface would never join the cycle-end
    // fade-out that every other demo's message stack does.
    <div className={`${styles.panel} messagesStack`}>
      <div className={styles.stage}>
        <div className={styles.orb}>
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
        <div className={styles.captions}>
          <p id={`${id}-cap-connecting`} className={styles.caption}>
            {connectingLabel}
          </p>
          <p id={`${id}-cap-talking`} className={styles.caption}>
            <UserCircleIcon />
            {talkingLabel}
          </p>
        </div>
      </div>

      <div className={styles.controls}>
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
