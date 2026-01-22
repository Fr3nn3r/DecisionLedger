import { useLocation } from 'react-router-dom';
import { ErrorState } from '@/components/shared/ErrorState';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <ErrorState
      type="not-found"
      title="404 - Page Not Found"
      message={`The page "${location.pathname}" doesn't exist or has been moved.`}
      details="Check the URL for typos, or navigate back to the home page."
      actionLabel="Go to Claims"
      actionHref="/claims"
    />
  );
}
