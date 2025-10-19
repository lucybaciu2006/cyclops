import { AuthService } from '@/lib/auth.service';
import React, { FormEvent } from 'react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/language.context';
import LanguageSelector from '@/components/LanguageSelector';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // TODO: Implement API call to send reset password email
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    await AuthService.forgotPassword(email);
    toast.success('Reset password email sent');
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Language selector in top right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSelector />
      </div>

      {/* Logo in top left */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/">
          <img src="/logo.svg" alt="Logo" className="h-8 sm:h-10 cursor-pointer" />
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.resetPassword')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">{t('auth.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('auth.email')}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Send reset link
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
              {t('common.back')} to {t('auth.login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 