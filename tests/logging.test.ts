import { afterEach, expect, it, vi } from 'vitest';
import { logger, safeError } from '../src/shared/logging';

afterEach(() => vi.restoreAllMocks());

it('uses consistent scope prefixes and structured safe details', () => {
  const output = vi.spyOn(console, 'info').mockImplementation(() => {});
  logger('content')('hashchange detected', { previous: 'WAITING', next: 'QUESTION_ACTIVE', eligibleNewPoll: true });
  expect(output).toHaveBeenCalledWith('[iNoti][content] hashchange detected', {
    previous: 'WAITING', next: 'QUESTION_ACTIVE', eligibleNewPoll: true,
  });
});

it('classifies known API errors without echoing private suffixes', () => {
  expect(safeError(new Error('Extension context invalidated: private data'))).toBe('extension context invalidated; refresh the student page');
  expect(safeError({ message: 'Could not establish connection. Receiving end does not exist.' })).toBe('message receiving end does not exist');
  expect(safeError(new Error('https://student.iclicker.com/#/class/11111111-1111-4111-8111-111111111111'))).not.toContain('11111111');
  expect(safeError('private student data')).not.toContain('private student data');
});
