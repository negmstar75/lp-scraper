// scripts/fixSlugs.js

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  'https://wmsggecpjxfctuogeuyw.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

function normalizeSlug(raw) {
  if (!raw || raw.includes('/')) return raw;

  const match = raw.match(/^([a-z]+)([a-z]+)$/i);
  if (!match) return raw;

  return `${match[1]}/${match[2]}`.toLowerCase();
}

async function run() {
  console.log('🔍 Fetching destinations...');
  const { data, error } = await supabase.from('destinations').select('id, slug');

  if (error) {
    console.error('❌ Fetch failed:', error.message);
    return;
  }

  const updates = [];

  for (const row of data) {
    const fixed = normalizeSlug(row.slug);
    if (fixed !== row.slug) {
      updates.push({ id: row.id, slug: fixed });
    }
  }

  if (updates.length === 0) {
    console.log('✅ No malformed slugs to fix.');
    return;
  }

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from('destinations')
      .update({ slug: u.slug })
      .eq('id', u.id);

    if (updateError) {
      console.error(`❌ Failed to update ${u.id}:`, updateError.message);
    } else {
      console.log(`✅ Fixed: ${u.slug}`);
    }
  }

  console.log('🎉 Done.');
}

run();
