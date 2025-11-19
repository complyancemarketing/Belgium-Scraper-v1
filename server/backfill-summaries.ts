import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { generateSummary } from './ai-summarizer';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Backfill summaries for existing e-invoicing pages
 */
async function backfillSummaries() {
  console.log('🔄 Starting summary backfill for existing pages...');
  
  try {
    // Fetch all e-invoicing pages (including those with summaries to regenerate)
    const { data: pages, error } = await supabase
      .from('belgium_is_e_invoicing_pages')
      .select('*');

    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('✅ No pages found');
      return;
    }

    console.log(`📝 Regenerating summaries for ${pages.length} pages`);

    let successCount = 0;
    let failCount = 0;

    for (const page of pages) {
      try {
        console.log(`Generating summary for: ${page.title}`);
        
        const summary = await generateSummary({
          title: page.title,
          content: page.content,
          url: page.url,
        });

        // Update the page with the generated summary
        const { error: updateError } = await supabase
          .from('belgium_is_e_invoicing_pages')
          .update({ summary })
          .eq('id', page.id);

        if (updateError) {
          console.error(`Failed to update page ${page.id}:`, updateError);
          failCount++;
        } else {
          successCount++;
          console.log(`✅ Summary added for: ${page.title}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
        failCount++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total: ${pages.length}`);
  } catch (error) {
    console.error('Fatal error during backfill:', error);
  }
}

// Run the backfill
backfillSummaries().then(() => {
  console.log('🎉 Backfill complete!');
  process.exit(0);
}).catch(error => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
