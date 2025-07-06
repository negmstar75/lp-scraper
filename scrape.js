// api/scrape.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

import { getMockDestinations, generateSlug } from '../services/lonelyPlanetService.js';

export default async function handler(req, res) {
  const slugParam = req.query.slug || '';
  const mockData = getMockDestinations();

  let inserted = 0;
  for (const dest of mockData) {
    const slug = generateSlug({ city: dest.city, country: dest.country, name: dest.title });

    if (!slug.includes(slugParam)) continue;

    const { data: existing } = await supabase.from('destinations').select('id').eq('slug', slug).maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('destinations').insert([
        {
          ...dest,
          slug,
          name: dest.title,
          images: [dest.image],
        },
      ]);
      if (error) return res.status(500).json({ error: error.message });
      inserted++;
    }
  }

  return res.status(200).json({ status: 'ok', inserted });
}
