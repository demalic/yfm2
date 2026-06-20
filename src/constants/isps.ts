import type { EligibilityStatusBucket } from '../types';

export interface ISPDefinition {
  id: string;
  name: string;
  enabled: boolean;
  comingSoon?: boolean;
  /** Tower-side program names — used in API payload for routing */
  programs: {
    zipChecker: string;
    qualifier: string;
  };
  statusBuckets: EligibilityStatusBucket[];
}

/** Frontier output buckets from frontier_checker53.py */
export const FRONTIER_STATUS_BUCKETS: EligibilityStatusBucket[] = [
  { key: 'eligible', label: 'Eligible', description: 'Fiber available, no existing service', color: 'text-green-400', bgColor: 'bg-green-500/15' },
  { key: 'notEligible', label: 'Not Eligible', description: 'No fiber service available', color: 'text-red-400', bgColor: 'bg-red-500/15' },
  { key: 'existingCustomer', label: 'Existing Customer', description: 'Active service at address', color: 'text-orange-400', bgColor: 'bg-orange-500/15' },
  { key: 'futureFiber', label: 'Future Fiber', description: 'Copper now, fiber coming', color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  { key: 'skipped', label: 'Skipped', description: 'Not found or blocked', color: 'text-gray-400', bgColor: 'bg-gray-500/15' },
];

export const ISP_REGISTRY: ISPDefinition[] = [
  {
    id: 'frontier',
    name: 'Frontier',
    enabled: true,
    programs: {
      zipChecker: 'frontier_zipcheck_v2',
      qualifier: 'frontier_checker53',
    },
    statusBuckets: FRONTIER_STATUS_BUCKETS,
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    enabled: false,
    comingSoon: true,
    programs: { zipChecker: 'spectrum_zipcheck', qualifier: 'spectrum_checker' },
    statusBuckets: [],
  },
  {
    id: 'att',
    name: 'AT&T',
    enabled: false,
    comingSoon: true,
    programs: { zipChecker: 'att_zipcheck', qualifier: 'att_checker' },
    statusBuckets: [],
  },
  {
    id: 'xfinity',
    name: 'Xfinity',
    enabled: false,
    comingSoon: true,
    programs: { zipChecker: 'xfinity_zipcheck', qualifier: 'xfinity_checker' },
    statusBuckets: [],
  },
];

export function getISP(id: string): ISPDefinition | undefined {
  return ISP_REGISTRY.find((isp) => isp.id === id);
}
