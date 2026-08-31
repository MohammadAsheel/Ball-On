/**
 * Frontend API boundary. Route components consume the typed `api` client and
 * never call the FastAPI service directly.
 *
 * The existing library import remains as a compatibility export while routes
 * migrate; keeping this boundary prevents UI modules from coupling to URLs.
 */
export { api } from '@/lib/api';
export type {
  ComparedPlayer,
  PlayerEstimatorResult,
  PlayerProfile,
  PlayerSearchItem,
  TransfersResponse,
  ValuationPrediction,
  SportMonksMatch,
  SportMonksMatchesResponse,
  SportMonksEvent,
  SportMonksStat,
  SportMonksLineups,
  TransfermarktProfile,
  TransfermarktLiveResponse,
  TransfermarktTrophy,
  BigBallsMatch,
  BigBallsMatchesResponse,
} from '@/lib/types';



