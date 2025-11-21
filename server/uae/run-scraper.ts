import { startScraping } from './scraper';
import { getAppSettings } from './persistence';

/**
 * Standalone UAE scraper runner for GitHub Actions
 * This script runs the UAE scraper once and exits
 */
async function runUaeScraper() {
  console.log('🚀 Starting scheduled UAE scraper run...');
  console.log('⏰ Time:', new Date().toISOString());
  
  try {
    // Load settings to check auto-run toggle
    const settings = await getAppSettings();
    
    // Check if auto-run is enabled
    if (!settings.autoRunEnabled) {
      console.log('⏸️  Auto-run is disabled for UAE. Skipping scraper execution.');
      console.log('💡 Enable auto-run in the UAE dashboard to allow scheduled scraping.');
      process.exit(0);
    }
    
    console.log('✅ Auto-run is enabled for UAE');
    
    // Note: UAE uses global Teams webhook from Belgium settings
    console.log('📢 Teams notifications use global webhook (configured on homepage)');
    
    // Run the scraper
    console.log('🔍 Starting UAE e-invoicing scraper...');
    console.log('🌐 Target: https://mof.gov.ae');
    console.log('📋 Mode: Checking only new pages (onlyNew: true)');
    await startScraping({ onlyNew: true, mode: 'auto' });
    
    console.log('✅ UAE scraper completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ UAE scraper failed:', error);
    process.exit(1);
  }
}

// Run the scraper
runUaeScraper();

