import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function sendFloatAlert(floatAmount: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Float running low",
        body: `Your float is KSh ${Math.round(floatAmount).toLocaleString()}. Reduce spending today.`,
      },
      trigger: null,
    });
  } catch {
    // Notifications not available in Expo Go — ignore
  }
}

export async function scheduleDailyReminder(): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

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
  } catch {
    // Notifications not available in Expo Go — ignore
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
