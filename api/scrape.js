// api/scrape.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Utility: generate slug
const generateSlug = ({ name = '', city = '', country = '' }) => {
  const clean = str => str?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
  const c = clean(city);
  const co = clean(country);
  if (c && co) return `${co}/${c}`;
  if (co) return co;
  return clean(name) || 'destination';
};

// Mock destinations (replace with real fetch logic if needed)
const getMockDestinations = () => [
  {
    title: 'New York City, USA',
    summary: 'The Big Apple—iconic, energetic, diverse.',
    image: 'https://source.unsplash.com/featured/?new-york,travel',
    city: 'new york',
    country: 'usa',
    category: 'trending',
    interests: ['trending', 'cultural', 'luxury'],
  },
  {
    title: 'Tokyo, Japan',
    summary: 'Futuristic energy meets ancient temples.',
    image: 'https://source.unsplash.com/featured/?tokyo,travel',
    city: 'tokyo',
    country: 'japan',
    category: 'trending',
    interests: ['cultural', 'food'],
  },
];

export default async function handler(req, res) {
  try {
    const mockData = getMockDestinations();
    const inserted = [];
    const skipped = [];

    for (const dest of mockData) {
      const slug = generateSlug({ name: dest.title, city: dest.city, country: dest.country });

      const { data: existing, error: checkError } = await supabase
        .from('destinations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (checkError) {
        console.warn(`❌ Check failed for ${slug}:`, checkError.message);
        skipped.push({ slug, reason: 'check error' });
        continue;
      }

      if (!existing) {
        const { error: insertError } = await supabase.from('destinations').insert([
          {
            name: dest.title,
            summary: dest.summary,
            image: dest.image,
            slug,
            country: dest.country,
            city: dest.city,
            category: dest.category,
            interests: dest.interests,
            images: [dest.image],
          },
        ]);

        if (insertError) {
          console.error(`❌ Insert failed for ${slug}:`, insertError.message);
          skipped.push({ slug, reason: 'insert error' });
        } else {
          console.log(`✅ Inserted: ${slug}`);
          inserted.push(slug);
        }
      } else {
        console.log(`⚠️ Already exists: ${slug}`);
        skipped.push({ slug, reason: 'already exists' });
      }
    }

    res.status(200).json({
      status: 'success',
      inserted,
      skipped,
    });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
