import type { SeedMilestoneInput } from '../db/database';
import { MILESTONES_A0 } from './milestonesA0';
import { MILESTONES_A1 } from './milestonesA1';
import { MILESTONES_A2 } from './milestonesA2';
import { MILESTONES_B1 } from './milestonesB1';

export { MILESTONES_A0 } from './milestonesA0';
export { MILESTONES_A1 } from './milestonesA1';
export { MILESTONES_A2 } from './milestonesA2';
export { MILESTONES_B1 } from './milestonesB1';

export const ALL_MILESTONES: SeedMilestoneInput[] = [
  ...MILESTONES_A0,
  ...MILESTONES_A1,
  ...MILESTONES_A2,
  ...MILESTONES_B1,
].map((m, idx) => ({
  ...m,
  orderIndex: idx + 1,
}));
