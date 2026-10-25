import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlaceId, buildReviewLink, parseInput } from '../src/review-link.js';

// Google's own documentation example Place ID (Sydney office) — public, not a client.
const ID = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
const LINK = `https://search.google.com/local/writereview?placeid=${ID}`;

test('isPlaceId accepts real-looking IDs and rejects junk', () => {
  assert.equal(isPlaceId(ID), true);
  assert.equal(isPlaceId('  ' + ID + '  '), true);
  assert.equal(isPlaceId('short'), false);
  assert.equal(isPlaceId('has spaces in it but is long enough'), false);
  assert.equal(isPlaceId(null), false);
});

test('buildReviewLink builds the writereview URL', () => {
  assert.equal(buildReviewLink(ID), LINK);
  assert.throws(() => buildReviewLink('nope'));
});

test('parseInput: raw Place ID', () => {
  const r = parseInput(ID);
  assert.equal(r.ok, true);
  assert.equal(r.link, LINK);
  assert.equal(r.placeId, ID);
});

test('parseInput: existing review link (with and without scheme)', () => {
  assert.equal(parseInput(LINK).link, LINK);
  assert.equal(parseInput(LINK.replace('https://', '')).link, LINK);
});

test('parseInput: query_place_id and inline place_id', () => {
  assert.equal(parseInput(`https://www.google.com/maps/search/?api=1&query=Acme&query_place_id=${ID}`).link, LINK);
  assert.equal(parseInput(`https://www.google.com/maps/place/?q=place_id:${ID}`).link, LINK);
  assert.equal(parseInput(`https://www.google.com/maps/place/?q=place_id%3A${ID}`).link, LINK);
});

test('parseInput: g.page short links', () => {
  assert.equal(parseInput('https://g.page/r/CAbC123xyz/review').link, 'https://g.page/r/CAbC123xyz/review');
  assert.equal(parseInput('g.page/r/CAbC123xyz').link, 'https://g.page/r/CAbC123xyz/review');
});

test('parseInput: helpful errors', () => {
  assert.equal(parseInput('').error, 'empty');
  assert.equal(parseInput('https://maps.app.goo.gl/AbCdEf').error, 'short-link');
  assert.equal(parseInput('https://www.google.com/maps/place/Acme+Plumbing/@1,2,17z').error, 'maps-link-without-id');
  assert.equal(parseInput('hello world').error, 'unrecognised');
  assert.equal(parseInput('https://example.com/page').error, 'unrecognised');
});
