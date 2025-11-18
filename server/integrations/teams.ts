interface TeamsNotificationPage {
  title: string;
  url: string;
}

export async function sendTeamsNotification(
  webhookUrl: string,
  pages: TeamsNotificationPage[]
): Promise<void> {
  if (!webhookUrl || pages.length === 0) {
    return;
  }

  const lines = pages
    .map(
      (page, index) =>
        `${index + 1}. [${page.title}](${page.url})`
    )
    .join("\n");

  const text = `🧾 *New E-Invoicing Pages Found*\n${lines}`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

