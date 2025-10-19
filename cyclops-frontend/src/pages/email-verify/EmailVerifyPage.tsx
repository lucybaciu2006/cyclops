import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthService } from '@/lib/auth.service';
import { Header } from '@/components/layout/Header';

export const EmailVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Sorry, the link is invalid or expired');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await AuthService.verifyEmail(token);
        toast.success('Email verified successfully!');
        navigate('/login');
      } catch (err) {
        setError('Sorry, the link is invalid or expired');
        toast.error('Email verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
          <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
          <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-4 py-2"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 