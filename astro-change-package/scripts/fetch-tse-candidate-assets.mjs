import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://resultados.tse.jus.br';
const CYCLE = 'ele2026';
const ELECTION = '6258';
const OFFICE = '0001';
const SCOPE = 'br';
const outDir = path.resolve('public/assets/tse/candidates');

const resultUrl = `${BASE}/oficial/${CYCLE}/${ELECTION}/dados/${SCOPE}/${SCOPE}-c${OFFICE}-e${String(ELECTION).padStart(6, '0')}-u.json`;

function collectCandidates(payload) {
  const candidates = [];
  for (const cargo of payload.carg ?? []) {
    if (String(cargo.cd) !== '1') continue;
    for (const group of cargo.agr ?? []) {
      for (const party of group.par ?? []) {
        for (const candidate of party.cand ?? []) {
          candidates.push({ ...candidate, party: party.sg });
        }
      }
    }
  }
  return candidates;
}

const response = await fetch(resultUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`TSE EA20 failed: ${response.status} ${response.statusText}`);
const payload = await response.json();
if (payload.ele !== ELECTION || payload.f !== 'o' || payload.cdabr !== 'br') throw new Error('Unexpected TSE election payload');
await mkdir(outDir, { recursive: true });

const manifest = [];
for (const candidate of collectCandidates(payload)) {
  if (!/^\d+$/.test(candidate.sqcand) || !/^\d+$/.test(candidate.n) || typeof candidate.nmu !== 'string') throw new Error('Invalid candidate identity');
  const photoUrl = `${BASE}/oficial/${CYCLE}/${ELECTION}/fotos/${SCOPE}/${candidate.sqcand}.jpeg`;
  const photo = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
  if (!photo.ok) {
    console.warn(`Photo unavailable for ${candidate.nmu}: ${photo.status}`);
    continue;
  }
  const safe = `${candidate.n}-${String(candidate.nmu).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpeg`;
  if (!photo.headers.get('content-type')?.startsWith('image/')) throw new Error('Unexpected candidate photo content type');
  const bytes = Buffer.from(await photo.arrayBuffer());
  if (bytes.length > 5_000_000) throw new Error('Candidate photo exceeds size limit');
  await writeFile(path.join(outDir, safe), bytes);
  manifest.push({ number: candidate.n, sqcand: candidate.sqcand, ballotName: candidate.nmu, party: candidate.party, file: safe, source: photoUrl });
}
await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Saved ${manifest.length} candidate photo(s) to ${outDir}`);
