interface TeamsNotificationPage {
  title: string;
  url: string;
  summary?: string;
  matchedKeyword?: string;
}

const BATCH_SIZE = 10; // Send 10 pages per message to avoid Teams message limits

export async function sendTeamsNotification(
  webhookUrl: string,
  pages: TeamsNotificationPage[],
  country: string = "Belgium"
): Promise<void> {
  if (!webhookUrl || pages.length === 0) {
    return;
  }

  console.log(`[Teams] Sending ${pages.length} pages, first page has summary:`, !!pages[0]?.summary);

  // Split pages into batches
  const batches: TeamsNotificationPage[][] = [];
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    batches.push(pages.slice(i, i + BATCH_SIZE));
  }

  console.log(`[Teams] Splitting into ${batches.length} batch(es) of up to ${BATCH_SIZE} pages each`);

  // Send each batch as a separate message
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const startNum = batchIndex * BATCH_SIZE + 1;
    
    const lines = batch
      .map((page, index) => {
        const keywordText = page.matchedKeyword 
          ? `\n   🔑 Keyword: ${page.matchedKeyword}` 
          : '';
        const summaryText = page.summary 
          ? `\n   📝 ${page.summary}\n` 
          : '\n';
        return `${startNum + index}. **[${page.title}](${page.url})**${keywordText}${summaryText}`;
      })
      .join("\n");

    const batchInfo = batches.length > 1 
      ? ` (Part ${batchIndex + 1}/${batches.length})` 
      : '';
    
    const text = `🧾 *New E-Invoicing Pages Found - ${country}*${batchInfo}\n\n${lines}`;

    console.log(`[Teams] Sending batch ${batchIndex + 1}/${batches.length}, message preview:`, text.substring(0, 200));

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    // Add a small delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[Teams] Successfully sent all ${batches.length} batch(es)`);
}

