import { Header } from '@/components/layout/Header';

export const EmailConfirmationPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent you an email with a confirmation link. Please check your inbox and click the link to verify your account.
            </p>
            <p className="text-sm text-gray-500">
              
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 