import { startScraping } from './scraper';
import { getAppSettings } from './persistence';

/**
 * Standalone scraper runner for GitHub Actions
 * This script runs the scraper once and exits
 */
async function runScraper() {
  console.log('🚀 Starting scheduled scraper run...');
  console.log('⏰ Time:', new Date().toISOString());
  
  try {
    // Load settings to check auto-run toggle
    const settings = await getAppSettings();
    
    // Check if auto-run is enabled
    if (!settings.autoRunEnabled) {
      console.log('⏸️  Auto-run is disabled. Skipping scraper execution.');
      console.log('💡 Enable auto-run in the dashboard to allow scheduled scraping.');
      process.exit(0);
    }
    
    console.log('✅ Auto-run is enabled');
    
    if (!settings.teamsWebhookUrl) {
      console.warn('⚠️  No Teams webhook configured. Notifications will not be sent.');
    } else {
      console.log('✅ Teams webhook configured');
    }
    
    // Run the scraper
    console.log('🔍 Starting Belgium e-invoicing scraper...');
    console.log('📋 Mode: Checking only new pages (onlyNew: true)');
    await startScraping({ onlyNew: true, mode: 'auto' });
    
    console.log('✅ Scraper completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Scraper failed:', error);
    process.exit(1);
  }
}

// Run the scraper
runScraper();
