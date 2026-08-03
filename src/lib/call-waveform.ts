// Shared shape of the voice-call waveform.
//
// Lives in lib/ so the timeline engine and <CallPanel> read the same list: the
// engine emits one keyframe per unit and addresses them with :nth-child, so if
// the two ever disagreed on the count the extra units would silently never
// animate. Both import from here rather than the engine importing a component.
//
// Bar heights as a ratio of the tallest. Figma's "Sound" frame (3962:21691) is
// 104x80 with heights [23, 40, 80, 59, 23, 59, 23]; divided by 80 that is
// exactly the product waveform's BAR_RATIOS, so the design and the shipped
// widget agree and this list is both at once.
export const CALL_BAR_RATIOS = [0.29, 0.5, 1.0, 0.74, 0.29, 0.74, 0.29] as const;
