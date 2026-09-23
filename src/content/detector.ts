export type Route =
  | { state: 'UNSUPPORTED' }
  | { state: 'WAITING' | 'QUESTION_ACTIVE' | 'QUESTION_CLOSED'; classId: string };

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const classRoute = new RegExp(`^#/class/(${uuid})(?:/(poll)|/question/${uuid})?$`, 'i');

export function parseRoute(hash: string): Route {
  const match = classRoute.exec(hash);
  if (!match?.[1]) return { state: 'UNSUPPORTED' };
  return {
    state: match[2] ? 'QUESTION_ACTIVE' : hash.split('/').length === 3 ? 'WAITING' : 'QUESTION_CLOSED',
    classId: match[1].toLowerCase(),
  };
}

export function isNewPoll(previous: Route | undefined, next: Route): boolean {
  return next.state === 'QUESTION_ACTIVE'
    && (previous?.state === 'WAITING' || previous?.state === 'QUESTION_CLOSED')
    && previous.classId === next.classId;
}
