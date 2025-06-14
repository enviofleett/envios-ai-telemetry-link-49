
import * as agents from './agents';
import * as analytics from './analytics';
import * as commissions from './commissions';
import * as users from './users';
import * as codes from './codes';

export const referralApi = {
  ...agents,
  ...analytics,
  ...commissions,
  ...users,
  ...codes,
};
