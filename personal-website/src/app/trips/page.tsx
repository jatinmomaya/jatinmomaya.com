import TripsPage from '../../components/TripsPage';
import { getTripSummaries } from '../../lib/trips.server';

export const metadata = {
  title: 'Photographs · Jatin Momaya',
  description: 'Photographs from my trips.',
};

export default function Trips() {
  return <TripsPage trips={getTripSummaries()} />;
}
