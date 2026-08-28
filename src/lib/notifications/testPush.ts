import { requestNotificationPermission } from "./adeudos";

export type PushNotificationTestOutcome =
  | "shown"
  | "unsupported"
  | "permission-denied"
  | "failed";

const TEST_TITLE = "Studia · Prueba push";
const TEST_BODY = "Esta es una notificación push de prueba.";
const TEST_TAG = "dev-push-test";

export async function sendPushNotificationTest(): Promise<PushNotificationTestOutcome> {
  if (typeof Notification === "undefined") return "unsupported";

  if (Notification.permission === "denied") return "permission-denied";
  if (Notification.permission !== "granted") {
    const granted = await requestNotificationPermission();
    if (!granted) return "permission-denied";
  }

  const options: NotificationOptions = {
    body: TEST_BODY,
    tag: TEST_TAG,
    icon: "/icon-192.png",
  };

  let activeRegistration: ServiceWorkerRegistration | undefined;
  if ("serviceWorker" in navigator) {
    try {
      activeRegistration = await navigator.serviceWorker.getRegistration();
    } catch {
      activeRegistration = undefined;
    }
  }
  if (activeRegistration !== undefined) {
    try {
      await activeRegistration.showNotification(TEST_TITLE, options);
      return "shown";
    } catch {
      activeRegistration = undefined;
    }
  }

  try {
    new Notification(TEST_TITLE, options);
    return "shown";
  } catch {
    return "failed";
  }
}