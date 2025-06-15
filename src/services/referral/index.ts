
import * as agents from './agents';
import * as analytics from './analytics';
import * as commissions from './commissions';
import * as users from './users';
import * as codes from './codes';
import * as admin from './admin';

export const referralApi = {
  ...agents,
  ...analytics,
  ...commissions,
  ...users,
  ...codes,
  ...admin,
};
