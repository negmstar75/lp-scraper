// scrapers/elsewhereItineraries.ts

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 🗺️ Country slug and region map
const countryList = [
  { slug: 'jordan', country: 'Jordan', region: 'Middle East' },
  { slug: 'japan', country: 'Japan', region: 'Asia' },
  { slug: 'italy', country: 'Italy', region: 'Europe' },
  { slug: 'morocco', country: 'Morocco', region: 'Africa' },
  { slug: 'peru', country: 'Peru', region: 'South America' },
];

function generateSlug(country: string, title: string) {
  return `${slugify(country, { lower: true })}/${slugify(title, { lower: true })}`;
}

async function scrapeItinerary(countryItem) {
  const { slug: countrySlug, country, region } = countryItem;
  const url = `https://www.elsewhere.io/${countrySlug}`;
  console.log(`🌍 Scraping Elsewhere: ${url}`);

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const title = $('h1').first().text().trim() || `Trip to ${country}`;
    const itineraryBlocks = $('h3:contains("Day"), h4:contains("Day"), p');
    let markdown = '';
    let days = 0;

    itineraryBlocks.each((_, el) => {
      const text = $(el).text().trim();
      if (/^day\s*\d+/i.test(text)) {
        markdown += `\n\n### ${text}\n`;
        days++;
      } else if (el.tagName === 'p' && text.length > 30) {
        markdown += `${text}\n`;
      }
    });

    if (days === 0 || days > 7) {
      console.warn(`⏭️ Skipping ${country}: No valid 7-day itinerary`);
      return;
    }

    // 🖼️ Attempt to find image (fallback to Unsplash)
    const image = $('meta[property="og:image"]').attr('content') ||
      `https://source.unsplash.com/featured/?${encodeURIComponent(country)},travel`;

    const slug = generateSlug(country, title);

    const { error } = await supabase.from('travel_itineraries').upsert([
      {
        slug,
        title,
        region,
        country,
        theme: 'Classic',
        days,
        places: [],
        markdown,
        source: 'elsewhere',
        image,
      },
    ]);

    if (error) {
      console.error(`❌ Failed to insert itinerary for ${country}:`, error.message);
    } else {
      console.log(`✅ Inserted Elsewhere itinerary: ${title}`);
    }
  } catch (err) {
    console.error(`❌ Error scraping ${url}`, err.message);
  }
}

export async function runElsewhereScraper() {
  for (const country of countryList) {
    await scrapeItinerary(country);
  }

  console.log('🎉 Done scraping Elsewhere itineraries');
}

// To run manually:
if (require.main === module) {
  runElsewhereScraper();
}
