import { describe, expect, it } from 'vitest';
import { isNewPoll, parseRoute } from '../src/content/detector';

const base = '#/class/11111111-1111-4111-8111-111111111111';
const question = '22222222-2222-4222-8222-222222222222';
const routes = [base, `${base}/poll`, `${base}/question/${question}`, '#/home'];

describe('route parsing', () => {
  it.each([
    [base, 'WAITING'], [`${base}/poll`, 'QUESTION_ACTIVE'],
    [`${base}/question/${question}`, 'QUESTION_CLOSED'],
    [`${base}/quiz/${question}`, 'UNSUPPORTED'], ['#/home', 'UNSUPPORTED'],
    ['#/class/not-a-uuid/poll', 'UNSUPPORTED'], ['#/class/', 'UNSUPPORTED'],
    [`${base}/question/not-a-uuid`, 'UNSUPPORTED'], [`${base}/poll/extra`, 'UNSUPPORTED'],
    [`${base}/poll?extra=true`, 'UNSUPPORTED'], [`${base}/poll/`, 'UNSUPPORTED'],
    ['', 'UNSUPPORTED'],
  ])('parses %s as %s', (hash, state) => {
    expect(parseRoute(hash)).toMatchObject({ state });
  });
});

describe('transition decisions', () => {
  for (const previous of routes) {
    for (const next of routes) {
      it(`${previous} -> ${next}`, () => {
        const expected = (previous === base || previous.includes('/question/')) && next === `${base}/poll`;
        expect(isNewPoll(parseRoute(previous), parseRoute(next))).toBe(expected);
      });
    }
  }
  it('establishes initial active state without notifying', () => {
    expect(isNewPoll(undefined, parseRoute(`${base}/poll`))).toBe(false);
  });
  it('does not infer a poll when changing classes', () => {
    expect(isNewPoll(parseRoute(base), parseRoute(`#/class/${question}/poll`))).toBe(false);
  });
});
