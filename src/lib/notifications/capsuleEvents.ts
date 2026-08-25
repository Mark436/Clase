/**
 * A transient notification surfaced through the context capsule as an
 * alternative to toasts (the channel is configurable). `followUp` renders as
 * a second stage after `detail`, enabling sequences like
 * "new grade → period average".
 */
export interface CapsuleNotification {
  /** Unique per occurrence; bumping it triggers the capsule pulse. */
  id: string;
  title: string;
  detail?: string;
  followUpTitle?: string;
  followUpDetail?: string;
}
