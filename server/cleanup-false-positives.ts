import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// E-invoicing keywords with word boundary checking
const E_INVOICING_KEYWORDS = [
  'e-invoicing', 'e-invoice', 'electronic invoice', 'electronic invoicing',
  'digital invoice', 'digital invoicing', 'vat invoice', 'electronic billing',
  'e-billing', 'peppol', 'ubl', 'xml invoice', 'structured invoice',
  'invoice automation',
  'facturation électronique', 'facture électronique', 'e-facturation',
  'e-facture', 'factures électroniques', 'facture numérique', 'facturation numérique',
  'facture digitale', 'facturation digitale', 'facture xml',
  'facture structurée',
  'elektronische facturering', 'elektronische factureren', 'elektronisch factureren',
  'elektronische factuur', 'elektronische facturatie',
  'e-facturering', 'e-factureren', 'e-factuur', 'e-facturen',
  'digitale facturering', 'digitale factuur',
  'gestructureerde factuur', 'xml factuur',
  'elektronische rechnung', 'e-rechnung', 'digitale rechnung',
  'elektronische rechnungsstellung', 'xml rechnung', 'strukturierte rechnung',
  'rechnungsautomatisierung',
];

// URLs to delete (false positives)
const FALSE_POSITIVE_URLS = [
  'https://bosa.belgium.be/fr/services/accompagnement-des-trajets-de-changement',
  'https://bosa.belgium.be/fr/services/construire-la-cartographie-de-votre-organisation',
  'https://bosa.belgium.be/nl/news/beluister-onze-podcast-over-welzijn-op-het-werk',
  'https://bosa.belgium.be/fr/news/budget-2025-credits-provisoires',
  'https://bosa.belgium.be/nl/news/ministerraad-verfijning-prestaties-persoonlijke-aangelegenheid-3-5de',
  'https://bosa.belgium.be/nl/news/meer-mogelijkheden-om-van-job-te-veranderen-bij-federale-overheid',
  'https://bosa.belgium.be/en/public-procurement-rules-and-procedures',
  'https://bosa.belgium.be/nl/applications/hermes',
  'https://bosa.belgium.be/nl/news/belgie-en-japan-ondertekenen-samenwerkingsovereenkomst-over-digitale-portefeuille',
  'https://bosa.belgium.be/nl/news/ministerraad-verfijning-prestaties-persoonlijke-aangelegenheid-35de',
];

function findMatchedKeyword(text: string, title: string, url: string): string | null {
  for (const keyword of E_INVOICING_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text) || regex.test(title) || regex.test(url)) {
      return keyword;
    }
  }
  return null;
}

async function cleanupAndAddKeywords() {
  console.log('🧹 Starting cleanup and keyword matching...\n');

  // Step 1: Delete false positives
  console.log('📋 Deleting false positive pages:');
  for (const url of FALSE_POSITIVE_URLS) {
    const { error } = await supabase
      .from('belgium_is_e_invoicing_pages')
      .delete()
      .eq('url', url);

    if (error) {
      console.error(`❌ Failed to delete ${url}:`, error);
    } else {
      console.log(`✓ Deleted: ${url}`);
    }
  }

  // Step 2: Fetch all remaining pages
  console.log('\n📝 Fetching remaining pages...');
  const { data: pages, error: fetchError } = await supabase
    .from('belgium_is_e_invoicing_pages')
    .select('id, url, title, content');

  if (fetchError) {
    console.error('❌ Failed to fetch pages:', fetchError);
    return;
  }

  if (!pages || pages.length === 0) {
    console.log('✅ No pages to process');
    return;
  }

  console.log(`Found ${pages.length} pages to check\n`);

  // Step 3: Find and update matched keywords
  let matchedCount = 0;
  let noMatchCount = 0;

  for (const page of pages) {
    const matchedKeyword = findMatchedKeyword(page.content, page.title, page.url);

    if (matchedKeyword) {
      const { error: updateError } = await supabase
        .from('belgium_is_e_invoicing_pages')
        .update({ matched_keyword: matchedKeyword })
        .eq('id', page.id);

      if (updateError) {
        console.error(`❌ Failed to update ${page.title}:`, updateError);
      } else {
        matchedCount++;
        console.log(`✓ ${page.title} → "${matchedKeyword}"`);
      }
    } else {
      noMatchCount++;
      console.log(`⚠️  No keyword match found for: ${page.title}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   (This might be a false positive that should be removed)\n`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Keywords matched: ${matchedCount}`);
  console.log(`⚠️  No match found: ${noMatchCount}`);
  console.log(`🗑️  False positives deleted: ${FALSE_POSITIVE_URLS.length}`);
}

cleanupAndAddKeywords()
  .then(() => {
    console.log('\n🎉 Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
