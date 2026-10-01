#!/usr/bin/env node
/**
 * build-case-corpus.mjs
 *
 * Harvests Prevention of Future Deaths (Regulation 28) reports from judiciary.uk
 * and produces a screened candidate queue for adjudication against
 * data/public-case-corpus/INCLUSION-PROTOCOL.md.
 *
 * This script does NOT decide inclusion. It reduces several thousand reports
 * to a ranked candidate list a human can adjudicate. Every included case must
 * still be read and its C1-C4 evidence quoted by hand. That is deliberate:
 * an evidence asset that was auto-classified is not an evidence asset.
 *
 * Source material is Crown copyright, published under the Open Government
 * Licence v3.0. Attribution is required. See data/public-case-corpus/README.md.
 *
 * Usage:
 *   node scripts/build-case-corpus.mjs --pages 3            smoke test
 *   node scripts/build-case-corpus.mjs                      full crawl (all categories)
 *   node scripts/build-case-corpus.mjs --category hospital  one category only
 *   node scripts/build-case-corpus.mjs --score-only         re-score cached results
 *   node scripts/build-case-corpus.mjs --list-only          listing pages only, no reports
 *
 * Outputs (all under data/public-case-corpus/):
 *   .cache/<slug>.html       raw fetched report pages (resumable, never re-fetched)
 *   candidates.jsonl         every screened report + signal scores
 *   candidates-ranked.md     human-readable adjudication worklist, highest signal first
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CORPUS = path.join(ROOT, 'data', 'public-case-corpus');
const CACHE = path.join(CORPUS, '.cache');

/* ------------------------------------------------------------------ *
 * Categories
 *
 * PFD reports are categorised by WHERE THE DEATH OCCURRED, not by which
 * organisation's care is in question. That is why crawling the Hospital
 * Death category alone is not sufficient: a patient discharged from an
 * acute trust who dies in a care home is filed under Care Home Health.
 * Those discharge-boundary cases are the most relevant to WardSafe's
 * thesis, because the boundary is where carry-forward fails hardest.
 *
 * Of the first seven adjudicated cases, only three sit in Hospital Death.
 * See the coverage warning in INCLUSION-PROTOCOL.md (v1.1).
 *
 * The actual filed categories of those seven were read off the live pages on
 * 15 Aug 2026 rather than taken from the protocol's prose, and two things
 * turned out to be wrong there:
 *
 *   - 2026-0049 (George) is filed under Community health care and emergency
 *     services, NOT Care Home Health as the protocol states.
 *   - 2025-0579 (Gray) is filed under **Other related deaths** — a category
 *     that was in neither the original nor the first extended list, so the
 *     coverage fix was itself still missing a real included case.
 *
 * Confirmed distribution: Hospital 3 (Smith, Fallows, Scott), Community 3
 * (George, Cahill, and Thompson which is dual-filed), Child Death 1
 * (Thompson), Other 1 (Gray). No included case is in Care Home Health —
 * that category is retained anyway as a plausible source of discharge-to-
 * care-home cases, but it is a hypothesis, not an observed hit.
 *
 * Note a report may carry MORE THAN ONE category (Thompson is filed under
 * both Child Death and Community), so category counts do not sum to the
 * case count and links are de-duplicated across categories at crawl time.
 *
 * Page counts below were observed on 15 Aug 2026 and are indicative only —
 * the crawler reads the real pagination from each listing and does not
 * rely on them.
 * ------------------------------------------------------------------ */
const CATEGORIES = [
  { id: 'hospital',  approxPages: 250, slug: 'hospital-death-clinical-procedures-and-medical-management-related-deaths' },
  { id: 'other',     approxPages:  79, slug: 'other-related-deaths' },
  { id: 'community', approxPages:  62, slug: 'community-health-care-and-emergency-services-related-deaths' },
  { id: 'child',     approxPages:  45, slug: 'child-death-from-2015' },
  { id: 'carehome',  approxPages:  41, slug: 'care-home-health-related-deaths' },
  { id: 'emergency', approxPages:  26, slug: 'emergency-services-related-deaths-2019-onwards' },
];

const listBase = (slug) => `https://www.judiciary.uk/pfd-types/${slug}`;

// Be a good citizen. This is a public judicial archive, not an API.
const DELAY_MS = 1200;
const USER_AGENT =
  'WardSafe-research-harvester/1.0 (public-record research; contact: simionolimpiu@gmail.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ *
 * Signal lexicon
 *
 * These map to the four inclusion criteria. They are a PRE-FILTER for
 * human attention, not a classifier. Weights are deliberately crude —
 * tune them against adjudicated outcomes once there are enough decided
 * cases to measure precision, and record the tuning in the manifest.
 * ------------------------------------------------------------------ */
const SIGNALS = {
  // C1 — more than one contact
  multiple_contacts: {
    weight: 3,
    patterns: [
      /\breadmi(tted|ssion)\b/i,
      /\bre-admi(tted|ssion)\b/i,
      /\bsecond admission\b/i,
      /\bthird admission\b/i,
      /\bfurther admission\b/i,
      /\breturned to (the )?hospital\b/i,
      /\brepresented\b/i,
      /\bre-attended\b/i,
      /\battended (on )?(two|three|four|several|multiple|a number of) occasions\b/i,
      /\bprevious(ly)? (attendance|admission|presentation)\b/i,
      /\bearlier (attendance|admission|presentation)\b/i,
      /\bon (each|both) (of these )?(occasion|admission|attendance)s?\b/i,
    ],
  },

  // C2 — closed as appropriate
  closed_as_appropriate: {
    weight: 2,
    patterns: [
      /\bdischarged?\b[^.]{0,80}\b(fit|well|appropriate|safe|stable|reassur)/i,
      /\bmedically fit for discharge\b/i,
      /\bassessed as (fit|well|stable)\b/i,
      /\bsent home\b/i,
      /\breassured\b/i,
      /\bno further action was (taken|considered)\b/i,
      /\bnot (escalated|referred|admitted|investigated)\b/i,
      /\bdeemed (to be )?(fit|well|stable|appropriate)\b/i,
    ],
  },

  // C3 — the information already existed
  prior_information: {
    weight: 3,
    patterns: [
      /\bcontained in\b[^.]{0,60}\bmedical records\b/i,
      /\balready (in|on|held|recorded|available|documented)\b/i,
      /\bformed part of\b[^.]{0,60}\brecords\b/i,
      /\bprevious(ly)? (advice|correspondence|letter|result|scan|test|diagnosis)\b/i,
      /\bcorrespondence from\b/i,
      /\bresult(s)? (was|were) (not )?(reviewed|chased|acted|followed|seen)\b/i,
      /\b(family|patient|wife|husband|son|daughter|mother|father)\b[^.]{0,80}\b(raised|advocated|expressed|reported|told|concerned|concerns)\b/i,
      /\bdeclined\b[^.]{0,60}\b(medication|treatment|dose)\b/i,
      /\bknown (history|diagnosis|risk)\b/i,
    ],
  },

  // C4 — longitudinal failure named by the coroner
  longitudinal_failure: {
    weight: 4,
    patterns: [
      /\bnot (flagged|carried (forward|over)|surfaced|highlighted|brought to)\b/i,
      /\bdid not form part of\b[^.]{0,60}\bconsiderations?\b/i,
      /\bnot updated (following|after)\b/i,
      /\bfail(ed|ure) to (review|re-?assess|revisit|reconsider|chase|follow up|escalate)\b/i,
      /\bno (proactive|systemic|system|process|failsafe|mechanism)\b[^.]{0,80}\b(flag|prompt|drive|require|review|chase)/i,
      /\bhandover\b[^.]{0,60}\b(inadequate|poor|absent|failed|not)\b/i,
      /\bcontinuity of care\b/i,
      /\bwhole (picture|clinical picture)\b/i,
      /\bnot (considered|revisited) (in|as) (the )?(round|whole|totality)\b/i,
      /\bworking diagnosis\b[^.]{0,60}\bnot (revisited|challenged|reconsidered)\b/i,
      /\brecords? management system\b/i,
      /\belectronic (patient )?record\b/i,

      /* --------------------------------------------------------------
       * Added 15 Aug 2026 after a ground-truth run against the four
       * hand-adjudicated cases showed the gate discarding TWO of them.
       *
       * Both misses were non-Hospital-category discharge-boundary cases
       * — i.e. exactly the cases the v1.1 coverage warning identifies as
       * the most valuable — so the pre-filter was compounding the very
       * bias the category extension was written to fix.
       *
       * These patterns are taken from the C4 evidence the adjudicator
       * actually quoted, not invented:
       *
       *  pfd-2026-0049 (Care Home): "The system for ensuring that
       *  discharge summaries are actioned was not available for me to
       *  see and I was not clear if any policy on this issue existed."
       *  The failure is an ABSENT system, phrased as a system that "was
       *  not available" — the existing `no (system|process|…)` pattern
       *  only matches the "no system…" word order.
       *
       *  pfd-2025-0171 (Child Death): "sent a message back advising of
       *  this, albeit not on the medical records system where an
       *  auditable trail would exist… a care navigator may not have a
       *  clear pathway on whom to refer a task or action to". The
       *  failure is information recorded OUTSIDE the record system.
       *
       * CAUTION: these were tuned on a known-good set of n=4. That is
       * far too small to claim the false-negative rate is fixed. Treat
       * the gate's recall as unmeasured until it has been checked
       * against a larger set of adjudicated outcomes, and re-measure it
       * whenever cases are added. See the tiering note in writeOutputs:
       * nothing that shows a multiple-contact signal is discarded, so a
       * lexicon gap costs ranking position, not the case itself.
       * -------------------------------------------------------------- */
      /\b(system|policy|process|procedure|protocol|pathway)\b[^.]{0,80}\b(was|were|is|are) not (available|clear|in place|followed|established|defined)\b/i,
      /\bnot clear (if|whether) any (policy|system|process|procedure|protocol)\b/i,
      /\bdischarge summar(y|ies)\b[^.]{0,80}\b(actioned|not actioned|not followed|not read|not received|not acted)\b/i,
      /\bnot (on|recorded on|entered on|documented on)\b[^.]{0,40}\b(medical )?records? system\b/i,
      /\bno (auditable|audit) trail\b/i,
      /\bauditable trail\b[^.]{0,40}\bwould (exist|have existed)\b/i,
      /\bno clear pathway\b/i,
      /\bnot have a clear pathway\b/i,
      /\b(task|action|referral|query)\b[^.]{0,60}\b(never|not) (actioned|followed up|referred|passed on|allocated)\b/i,
      /\bno (system|mechanism|process|failsafe)\b[^.]{0,60}\bto ensure\b/i,
      /\bfell between\b/i,
      /\blost to follow[- ]up\b/i,
    ],
  },

  // Negative signal — likely point failure, deprioritise
  point_failure: {
    weight: -2,
    patterns: [
      /\bsurgical (error|technique|complication)\b/i,
      /\bequipment (fail|fault|malfunction)\b/i,
      /\bnever event\b/i,
      /\bwrong[- ]site\b/i,
      /\bretained (swab|instrument)\b/i,
    ],
  },
};

/* ------------------------------------------------------------------ */

async function fetchText(url, { retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(DELAY_MS * attempt * 4);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(DELAY_MS * attempt * 2);
    }
  }
  throw new Error(`exhausted retries: ${url}`);
}

/** Pull report permalinks out of a category listing page. */
function parseListing(html) {
  const out = new Set();
  const re =
    /https:\/\/www\.judiciary\.uk\/prevention-of-future-death-reports\/[a-z0-9-]+\//gi;
  let m;
  while ((m = re.exec(html)) !== null) out.add(m[0]);
  return [...out];
}

/** Highest /page/N/ referenced by a listing's pagination, or 1. */
function parseMaxPage(html) {
  const pages = [...html.matchAll(/\/page\/(\d+)\//g)].map((m) => Number(m[1]));
  return pages.length ? Math.max(...pages) : 1;
}

const stripTags = (s) =>
  s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;|&#039;|&apos;/g, "'")
    .replace(/&quot;|&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

/** Normalise a heading for matching: apostrophe and case insensitive. */
const normHeading = (s) => stripTags(s).replace(/['’]/g, '').toUpperCase().trim();

/**
 * Parse the Regulation 28 body.
 *
 * The report is rendered as a `govuk-table` of numbered boxes, and that
 * structure is stable across coroner areas and categories (verified against
 * reports from the Hospital, Care Home, Child Death and maternity categories
 * on 15 Aug 2026 — all eleven rows, same headings).
 *
 * Box NUMBERING is not stable, and this is not hypothetical: in 2026-0069
 * the whole narrative sits in box 3 (INVESTIGATION and INQUEST) with box 4
 * near-empty, while in 2026-0049, 2025-0171 and 2025-0559 it sits in box 4
 * (CIRCUMSTANCES OF THE DEATH). So sections are located by HEADING TEXT and
 * the two narrative boxes are concatenated rather than chosen between.
 *
 * This replaces an earlier flattened-text scan which, because it sliced from
 * a heading up to the first "ACTION SHOULD BE TAKEN", silently swallowed the
 * concerns section into the circumstances section and double-counted it.
 */
/**
 * Split one table cell into its heading and its body.
 *
 * Four markup variants were observed in a 146-report crawl on 15 Aug 2026.
 * All four are real and all four occur in the live archive, because these
 * pages are pasted in from the coroner's own Word document rather than
 * generated from a template:
 *
 *   1. `<td>3</td><td><strong>HEADING</strong><br>body</td>`  (majority)
 *   2. `<td>1</td><td>CORONER<br><br>body</td>`               no <strong> at all
 *      (2026-0020 Taylor, 2025-0289 Levy — the latter also carries a stray
 *       `file:///C:/Users/...msohtmlclip1/` image tag from the Word paste)
 *   3. `<td>1. <strong>CORONER</strong> body</td>`            ONE cell, number inline
 *      (2025-0413 Jones)
 *   4. no table at all — body exists only in the PDF                (2025-0368 Reding)
 *
 * Variants 2 and 3 were silently yielding empty text before this change:
 * variant 3 produced zero boxes because the old code required two cells,
 * and variant 2 produced eleven boxes with no headings, so no section could
 * be located. Both looked identical to "this report has nothing in it".
 */
function parseCell(cellHtml) {
  // Prefer the first non-empty <strong>. Some cells open with
  // `<strong>&nbsp;</strong>` spacer runs, which are not the heading.
  for (const m of cellHtml.matchAll(/<strong>([\s\S]*?)<\/strong>/gi)) {
    const h = normHeading(m[1]);
    if (h.length > 2) {
      return { heading: h, text: stripTags(cellHtml.replace(m[0], ' ')) };
    }
  }

  // Variant 2: heading is plain text before the first <br>. Accept it only
  // if it actually looks like a heading — short, and predominantly capitals
  // (allowing the lowercase connectives the real headings use, as in
  // "INVESTIGATION and INQUEST" and "COPIES and PUBLICATION").
  const [first = ''] = cellHtml.split(/<br\s*\/?>/i);
  const candidate = stripTags(first).replace(/^\d+[.)]?\s*/, '');
  const letters = candidate.replace(/[^A-Za-z]/g, '');
  const capitals = candidate.replace(/[^A-Z]/g, '');
  if (candidate && candidate.length <= 60 && letters && capitals.length / letters.length > 0.6) {
    return {
      heading: normHeading(candidate),
      text: stripTags(cellHtml.slice(first.length)),
    };
  }

  return { heading: '', text: stripTags(cellHtml) };
}

function parseBoxes(html) {
  const rowRe = /<tr[^>]*class="govuk-table__row"[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<t[dh][^>]*class="govuk-table__(?:cell|header)"[^>]*>([\s\S]*?)<\/t[dh]>/gi;

  const boxes = [];
  for (const row of html.matchAll(rowRe)) {
    const cells = [...row[1].matchAll(cellRe)].map((c) => c[1]);
    if (!cells.length) continue;

    // Variant 3 puts the box number inside the single content cell.
    const twoCell = cells.length >= 2;
    const contentCell = twoCell ? cells[1] : cells[0];
    const { heading, text } = parseCell(contentCell);

    const box = twoCell
      ? stripTags(cells[0]) || null
      : (stripTags(cells[0]).match(/^\s*(\d+)[.)]?\s/) || [])[1] || null;

    boxes.push({ box, heading, text });
  }
  return boxes;
}

const boxText = (boxes, ...headings) =>
  boxes
    .filter((b) => headings.some((h) => b.heading.startsWith(h)))
    .map((b) => b.text)
    .filter(Boolean)
    .join('\n\n') || null;

/** Header metadata block: `<p>Ref: 2026-0069</p>` etc. */
function parseMeta(html) {
  const get = (label) => {
    const m = html.match(
      new RegExp(`${label}\\s*:\\s*([\\s\\S]{1,300}?)(?=<\\/p>|<br)`, 'i')
    );
    // Trailing punctuation is a transcription artifact of the header block
    // (e.g. "Manchester (West)."), not part of the value.
    const v = m ? stripTags(m[1]).replace(/[.,;:\s]+$/, '') : null;
    return v || null;
  };
  // NOTE on names: this header block carries the SHORT form ("Roger Smith",
  // "Darren Stewart") while the report body carries the full legal form
  // ("Roger Knight Smith", "Darren STEWART OBE"). The hand-adjudicated
  // records use the body form. That is a difference in source, not a parse
  // error — but it means these fields are for identifying the report in a
  // worklist, and must not be copied into a corpus record without reading
  // the report. Protocol rule 1: source text only.
  return {
    ref: get('Ref'),
    report_date: get('Date of report'),
    deceased_name: get('Deceased name'),
    coroner_name: get('Coroners? name'),
    coroner_area: get('Coroners? Area'),
    // The permalink states its own category. Recording it means the coverage
    // question ("which categories is the pattern actually filed under?") can
    // be answered from the data instead of re-derived by hand.
    category: get('Category'),
    sent_to: get('This report is being sent to'),
  };
}

/**
 * Attachments.
 *
 * `response_published` is ONLY visible on the HTML permalink, never in the
 * report PDF — the 2026-0069 record was originally logged as `false` for
 * exactly this reason (see VERIFICATION-LOG.md, 15 Aug 2026). A published
 * response, or its absence, is itself a finding.
 *
 * Note on the earlier "fetch the PDF instead of the page body" suggestion
 * (VERIFICATION-LOG, 15 Aug 2026): declined as stated, but only PARTLY, and
 * the correction matters. The HTML permalink normally carries the full Reg 28
 * text, PDF extraction would need a new dependency, and `response_published`
 * is visible only on the HTML — so the page must be fetched either way, and
 * fetching PDFs for every report would be additional traffic against a public
 * judicial archive rather than a saving.
 *
 * BUT a 146-report crawl found reports (2025-0368 Reding) that publish NO
 * report body in the HTML at all — metadata and a PDF link, nothing else.
 * For those the PDF genuinely is the only source. They are marked
 * `body_source: 'pdf-only'` and surfaced as a warning rather than being
 * scored as empty, because a report with no text scores zero and would
 * otherwise vanish into the below-threshold tier looking like a considered
 * rejection. Reading them requires either a PDF dependency or a human
 * opening the link; until that is decided they must stay visible.
 */
function parseAttachments(html) {
  const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], text: stripTags(m[2]) }))
    .filter((a) => /wp-content\/uploads\/[^"]*\.pdf$/i.test(a.href));

  const isResponse = (a) => /response/i.test(a.text) || /response/i.test(a.href);

  return {
    pdf_url: anchors.find((a) => !isResponse(a))?.href || null,
    response_published: anchors.some(isResponse),
    response_urls: anchors.filter(isResponse).map((a) => a.href),
  };
}

export function parseReport(html, url, categoryId) {
  const boxes = parseBoxes(html);
  const meta = parseMeta(html);
  const attachments = parseAttachments(html);

  const circumstances = boxText(
    boxes,
    'INVESTIGATION AND INQUEST',
    'CIRCUMSTANCES OF THE DEATH',
    'CIRCUMSTANCES OF DEATH'
  );
  const concerns = boxText(boxes, 'CORONERS CONCERNS', 'MATTERS OF CONCERN');

  // Distinguish "the page has no report body" from "the parser failed".
  // Both produce empty text; only one is our bug.
  const hasBodyMarkup = /REGULATION\s*28/i.test(html) || boxes.length > 0;
  const body_source = hasBodyMarkup ? 'html' : attachments.pdf_url ? 'pdf-only' : 'none';

  return {
    url,
    harvested_category: categoryId,
    ...meta,
    ...attachments,
    body_source,
    box_count: boxes.length,
    circumstances,
    concerns,
    // Scoring uses circumstances + concerns only. Scoring the whole page
    // would match the site's own boilerplate and navigation chrome.
    scoring_text: [circumstances, concerns].filter(Boolean).join('\n\n'),
  };
}

export function score(report) {
  const text = report.scoring_text || '';
  const hits = {};
  let total = 0;

  for (const [name, { weight, patterns }] of Object.entries(SIGNALS)) {
    const matched = patterns.filter((p) => p.test(text));
    if (matched.length) {
      hits[name] = matched.map((p) => {
        const m = text.match(p);
        return m ? m[0].slice(0, 160) : String(p);
      });
      total += weight * Math.min(matched.length, 3);
    }
  }

  /* --------------------------------------------------------------------
   * Tiering, not a binary gate.
   *
   * The original design discarded anything not showing BOTH a
   * multiple-contact and a longitudinal-failure signal. A ground-truth run
   * on 15 Aug 2026 against the four hand-adjudicated cases found that gate
   * rejecting two of them — a 50% false-negative rate on the only set where
   * the right answer is known — because the coroners phrased the
   * longitudinal failure in language the lexicon had no pattern for.
   *
   * The lexicon has been extended, but a lexicon will always lag the
   * language of reports not yet written. So the gate is no longer allowed
   * to delete anything: a report showing C1 evidence but no C4 signal drops
   * to `borderline` and is still written to the worklist, in its own
   * section, for a human to skim. This is the same principle the evidence
   * corpus already applies to excluded records — never silently drop a
   * record; make the rejection visible and reviewable.
   *
   *   gated      — both signals. Adjudicate first.
   *   borderline — exactly one signal. Skim; the lexicon may have missed it.
   *   out        — neither. Not written to the worklist, but retained in
   *                candidates.jsonl so the denominator stays intact.
   * ------------------------------------------------------------------ */
  const c1 = Boolean(hits.multiple_contacts);
  const c4 = Boolean(hits.longitudinal_failure);
  const tier = c1 && c4 ? 'gated' : c1 || c4 ? 'borderline' : 'out';

  return { total, tier, gated: tier === 'gated', hits };
}

async function collectLinks({ categories, pages }) {
  // slug -> first category that yielded it. A report belongs to one
  // category, but crawls overlap in time, so dedup across the whole run.
  const links = new Map();

  for (const cat of categories) {
    const base = listBase(cat.slug);
    const first = await fetchText(`${base}/`);
    const maxPage = parseMaxPage(first);
    const limit = Math.min(pages ?? maxPage, maxPage);

    let added = 0;
    for (const l of parseListing(first)) {
      if (!links.has(l)) { links.set(l, cat.id); added++; }
    }
    process.stdout.write(
      `\n${cat.id.padEnd(10)} ${maxPage} pages available, crawling ${limit}\n`
    );

    for (let p = 2; p <= limit; p++) {
      process.stdout.write(`\r  listing ${p}/${limit}   `);
      await sleep(DELAY_MS);
      try {
        for (const l of parseListing(await fetchText(`${base}/page/${p}/`))) {
          if (!links.has(l)) { links.set(l, cat.id); added++; }
        }
      } catch (err) {
        console.warn(`\n  listing ${cat.id} p${p} failed: ${err.message}`);
      }
    }
    console.log(`\r  ${added} new report links${' '.repeat(20)}`);
    await sleep(DELAY_MS);
  }

  return links;
}

async function harvest({ categories, pages, listOnly }) {
  await mkdir(CACHE, { recursive: true });

  const links = await collectLinks({ categories, pages });
  console.log(`\ncollected ${links.size} unique report links across ${categories.length} categories`);
  if (listOnly) return [];

  const results = [];
  let i = 0;
  let fetched = 0;
  let cached = 0;

  for (const [link, categoryId] of links) {
    i++;
    const slug = link.replace(/\/$/, '').split('/').pop();
    const cacheFile = path.join(CACHE, `${slug}.html`);

    let html;
    if (existsSync(cacheFile)) {
      html = await readFile(cacheFile, 'utf8');
      cached++;
    } else {
      process.stdout.write(`\rfetching ${i}/${links.size}  ${slug.slice(0, 46).padEnd(46)}`);
      try {
        html = await fetchText(link);
        await writeFile(cacheFile, html);
        fetched++;
      } catch (err) {
        console.warn(`\n  fetch failed ${slug}: ${err.message}`);
        continue;
      }
      await sleep(DELAY_MS);
    }

    const report = parseReport(html, link, categoryId);
    results.push({ ...report, slug, score: score(report) });
  }

  console.log(`\n${fetched} fetched, ${cached} from cache`);
  return results;
}

function parseWarnings(results) {
  // A silent parse regression would look exactly like "no candidates today".
  // Surface it instead.
  const pdfOnly = results.filter((r) => r.body_source === 'pdf-only');
  // A parse failure is a report that HAS body markup but yielded nothing.
  // pdf-only reports are a source limitation, not a parser fault, and are
  // reported separately so the two never get conflated.
  const parseFailed = results.filter((r) => r.body_source === 'html' && !r.scoring_text);
  const noRef = results.filter((r) => !r.ref);

  const out = [];
  if (parseFailed.length) {
    out.push(
      `${parseFailed.length} reports have body markup but yielded no circumstances/concerns text — ` +
        `PARSER BUG, markup variant not handled: ${parseFailed.map((r) => r.ref || r.slug).join(', ')}`
    );
  }
  if (pdfOnly.length) {
    out.push(
      `${pdfOnly.length} reports publish no HTML body — the PDF is the only source, so these ` +
        `cannot be screened by text and must be opened by hand: ${pdfOnly.map((r) => r.ref || r.slug).join(', ')}`
    );
  }
  if (noRef.length) out.push(`${noRef.length} reports have no Ref`);
  return out;
}

async function writeOutputs(results) {
  await writeFile(
    path.join(CORPUS, 'candidates.jsonl'),
    results.map((r) => JSON.stringify(r)).join('\n') + '\n'
  );

  const byTier = (t) =>
    results.filter((r) => r.score.tier === t).sort((a, b) => b.score.total - a.score.total);
  const gated = byTier('gated');
  const borderline = byTier('borderline');
  const out = byTier('out');

  const byCategory = {};
  for (const r of results) {
    const c = (byCategory[r.harvested_category] ??= { screened: 0, gated: 0, borderline: 0 });
    c.screened++;
    if (r.score.tier === 'gated') c.gated++;
    if (r.score.tier === 'borderline') c.borderline++;
  }

  const warnings = parseWarnings(results);

  const entry = (r) => {
    const out = [];
    out.push(`## ${r.deceased_name || r.slug} — ${r.ref || '?'}  (score ${r.score.total})`);
    out.push('');
    out.push(`- ${r.url}`);
    out.push(`- Coroner: ${r.coroner_name || '?'} · ${r.coroner_area || '?'}`);
    out.push(`- Category: ${r.category || r.harvested_category || '?'}`);
    out.push(`- Sent to: ${r.sent_to || '?'}`);
    out.push(`- Report date: ${r.report_date || '?'}`);
    out.push(`- Response published: ${r.response_published ? 'yes' : 'no'}`);
    out.push('');
    for (const [signal, matches] of Object.entries(r.score.hits)) {
      out.push(`  **${signal}**`);
      for (const m of matches) out.push(`  - \`${m.replace(/`/g, "'")}\``);
    }
    out.push('');
    out.push('- [ ] C1 multiple contacts · [ ] C2 closed as appropriate · [ ] C3 prior information · [ ] C4 longitudinal failure');
    out.push('', '---', '');
    return out;
  };

  const lines = [
    '# Adjudication worklist',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Screened **${results.length}** · gated **${gated.length}** · borderline **${borderline.length}** · below threshold **${out.length}**`,
    '',
    '| Category | Screened | Gated | Borderline |',
    '|---|---|---|---|',
    ...Object.entries(byCategory).map(
      ([c, v]) => `| ${c} | ${v.screened} | ${v.gated} | ${v.borderline} |`
    ),
    '',
    '**This ranking is not an inclusion decision.** Read each report and adjudicate',
    'against INCLUSION-PROTOCOL.md C1–C4, quoting evidence for each. Record every',
    'rejection and its reason code — the denominator is the asset.',
    '',
    '> **On the tiers.** A ground-truth run on 15 Aug 2026 found the old',
    "> both-signals-required gate rejecting two of the four cases that had already",
    '> been included by hand — and both misses were non-Hospital discharge-boundary',
    '> cases, the kind the coverage warning says matter most. The lexicon has been',
    '> extended, but it will always lag the language of reports not yet written, so',
    '> a single-signal report now drops to **borderline** rather than being dropped.',
    '> Skim the borderline list. Recall is unmeasured, not solved.',
    '',
  ];

  if (warnings.length) {
    lines.push('> **Parse warnings**', '>');
    for (const w of warnings) lines.push(`> - ${w}`);
    lines.push('');
  }

  lines.push('---', '');
  lines.push(`# Gated — ${gated.length}`, '');
  lines.push('Both a multiple-contact and a longitudinal-failure signal. Adjudicate first.', '', '---', '');
  for (const r of gated) lines.push(...entry(r));

  lines.push(`# Borderline — ${borderline.length}`, '');
  lines.push(
    'Exactly one of the two signals. Most will not meet C1–C4, but the lexicon',
    'is known to miss real cases, so these are shown rather than discarded.',
    '', '---', ''
  );
  for (const r of borderline) lines.push(...entry(r));

  // Reports with no HTML body cannot be text-screened at all. They score
  // zero and would otherwise sit in the below-threshold tier looking like a
  // considered rejection. List them explicitly as unscreened.
  const pdfOnly = results.filter((r) => r.body_source === 'pdf-only');
  lines.push(`# Not screened — PDF-only — ${pdfOnly.length}`, '');
  lines.push(
    'These reports publish no body text on the HTML page, so the signal lexicon',
    'never saw them. They are **unscreened, not rejected**. Open the PDF to',
    'adjudicate, or discount them explicitly and record that decision.',
    '', '---', ''
  );
  for (const r of pdfOnly) {
    lines.push(`## ${r.deceased_name || r.slug} — ${r.ref || '?'}`);
    lines.push('');
    lines.push(`- ${r.url}`);
    lines.push(`- PDF: ${r.pdf_url || '(none found)'}`);
    lines.push(`- Category: ${r.category || r.harvested_category || '?'}`);
    lines.push(`- Report date: ${r.report_date || '?'}`);
    lines.push('', '---', '');
  }

  await writeFile(path.join(CORPUS, 'candidates-ranked.md'), lines.join('\n'));

  console.log(`\nscreened   ${results.length}`);
  console.log(`gated      ${gated.length}`);
  console.log(`borderline ${borderline.length}`);
  console.log(`below      ${out.length}`);
  for (const [c, v] of Object.entries(byCategory)) {
    console.log(
      `  ${c.padEnd(10)} ${String(v.screened).padStart(4)} screened, ${String(v.gated).padStart(4)} gated, ${String(v.borderline).padStart(4)} borderline`
    );
  }
  for (const w of warnings) console.warn(`WARNING: ${w}`);
  console.log(`\nwrote candidates.jsonl and candidates-ranked.md to ${CORPUS}`);
  console.log('Next: adjudicate by hand against INCLUSION-PROTOCOL.md.');
}

function arg(argv, name) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main() {
  const argv = process.argv.slice(2);
  const pagesRaw = arg(argv, 'pages');
  const pages = pagesRaw === undefined ? undefined : Number(pagesRaw);
  const only = arg(argv, 'category');

  const categories = only
    ? CATEGORIES.filter((c) => c.id === only)
    : CATEGORIES;

  if (!categories.length) {
    throw new Error(
      `unknown --category "${only}". Known: ${CATEGORIES.map((c) => c.id).join(', ')}`
    );
  }

  if (argv.includes('--score-only')) {
    const raw = await readFile(path.join(CORPUS, 'candidates.jsonl'), 'utf8');
    const rows = raw.trim().split('\n').map((l) => JSON.parse(l));
    return writeOutputs(rows.map((r) => ({ ...r, score: score(r) })));
  }

  const results = await harvest({
    categories,
    pages,
    listOnly: argv.includes('--list-only'),
  });
  if (results.length) await writeOutputs(results);
}

// Only crawl when run as a script. Importing this module (to test the
// parser against cached fixtures) must never trigger network traffic.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
