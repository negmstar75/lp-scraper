import { runElsewhereScraper } from '../../../scrapers/elsewhereItineraries';

export default async function handler(req, res) {

  await runElsewhereScraper();
  return res.status(200).json({ status: 'ok', source: 'elsewhere' });
}
