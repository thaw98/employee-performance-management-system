interface AnonymousCheckable {
  direction?: string | null;
  anonymous?: boolean;
  evaluatorName?: string | null;
}

interface RoleDisplayable extends AnonymousCheckable {
  role?: string | null;
}

export const isReceivedAnonymous = (item: AnonymousCheckable): boolean =>
  item.direction === 'RECEIVED' &&
  (Boolean(item.anonymous) || item.evaluatorName?.trim().toLowerCase() === 'anonymous');

export const feedbackRoleDisplay = (item: RoleDisplayable): string => {
  if (item.role === 'SELF') return 'Self';
  return isReceivedAnonymous(item) ? '-' : (item.role || '-');
};
