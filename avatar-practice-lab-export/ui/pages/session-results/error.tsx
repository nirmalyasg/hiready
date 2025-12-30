

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'wouter';
import { useNavigate } from 'react-router-dom';

export default function Error() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Error Loading Session Results</h1>
      <p className="mb-4">Unable to load the session results. Please try again.</p>
      <Button 
        onClick={() => navigate('/')}
        className="mx-2"
      >
        Go Home
      </Button>
      <Button 
        onClick={() => navigate(-1)}
        className="mx-2"
      >
        Go Back
      </Button>
    </div>
  );
}
