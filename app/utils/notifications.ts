import * as Notifications from "expo-notifications";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Notifications as any).setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function sendFloatAlert(floatAmount: number): Promise<void> {
  const permission = await requestNotificationPermission();
  if (!permission) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚠️ Float running low",
      body: `Your float is KSh ${Math.round(floatAmount).toLocaleString()}. Reduce spending today.`,
    },
    trigger: null,
  });
}

export async function scheduleDailyReminder(): Promise<void> {
  const permission = await requestNotificationPermission();
  if (!permission) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "☀️ Good morning",
      body: "Check your float for today.",
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    } as any,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
