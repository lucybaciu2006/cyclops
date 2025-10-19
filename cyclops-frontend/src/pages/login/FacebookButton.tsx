import { useState, useEffect, useRef, useCallback } from 'react';
import {ConfigFile} from "@/config-file.ts";
import {FaFacebook} from "react-icons/fa";
import {Button} from "@/components/ui/button.tsx";

interface FacebookAuthResponse {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
}

interface FacebookLoginStatusResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse: FacebookAuthResponse | null;
}

interface FacebookLoginOptions {
    scope: string;
    return_scopes?: boolean;
    enable_profile_selector?: boolean;
    auth_type?: string;
}

interface FacebookSDK {
    init(options: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
    }): void;
    login(callback: (response: FacebookLoginStatusResponse) => void, options?: FacebookLoginOptions): void;
    api(path: string, params: { fields: string }, callback: (response: any) => void): void;
}

declare global {
    interface Window {
        fbAsyncInit?: () => void;
        FB?: FacebookSDK;
    }
}

interface FacebookButtonProps {
    handleFacebookSuccess: (accessToken: string) => Promise<void> | void;
    onFacebookError: (message: string) => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
    label: string;
    signup?: boolean;
    setError: (name: string, error: { type: string; message: string }) => void;
    disabled?: boolean;
}

const FacebookButton = ({
                            handleFacebookSuccess,
                            onFacebookError,
                            onInteractionStart = () => {},
                            onInteractionEnd = () => {},
                            label,
                            setError,
                            disabled = false
                        }: FacebookButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [sdkError, setSdkError] = useState<string | null>(null);
    const sdkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    const initializeFacebookSDK = useCallback(() => {
        if (window.FB) {
            window.FB.init({
                appId: ConfigFile.FACEBOOK_CLIENT_ID,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            setSdkLoaded(true);
            setSdkError(null);
            return;
        }

        if (sdkTimeoutRef.current) {
            clearTimeout(sdkTimeoutRef.current);
        }

        window.fbAsyncInit = function () {
            if (window.FB) {
                window.FB.init({
                    appId: ConfigFile.FACEBOOK_CLIENT_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                if (isMounted.current) {
                    setSdkLoaded(true);
                    setSdkError(null);
                }
            } else {
                if (isMounted.current) {
                    setSdkError('Facebook SDK failed to initialize');
                }
            }
        };

        sdkTimeoutRef.current = setTimeout(() => {
            if (!window.FB && isMounted.current) {
                setSdkError('Facebook SDK might be blocked by browser extensions');
                setSdkLoaded(false);
            }
        }, 5000);

        try {
            const id = 'facebook-jssdk';
            if (!document.getElementById(id)) {
                const js = document.createElement('script');
                js.id = id;
                js.src = 'https://connect.facebook.net/en_US/sdk.js';
                js.async = true;
                js.defer = true;
                js.onload = () => {
                    if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current);
                };
                js.onerror = (e) => {
                    if (isMounted.current) {
                        setSdkError('Failed to load Facebook SDK');
                        setSdkLoaded(false);
                    }
                    if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current);
                };

                const fjs = document.getElementsByTagName('script')[0];
                if (fjs && fjs.parentNode) {
                    fjs.parentNode.insertBefore(js, fjs);
                } else {
                    document.head.appendChild(js);
                }
            }
        } catch (error) {
            if (isMounted.current) {
                setSdkError('Error loading Facebook SDK');
                setSdkLoaded(false);
            }
            if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        initializeFacebookSDK();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                initializeFacebookSDK();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted.current = false;
            if (sdkTimeoutRef.current) clearTimeout(sdkTimeoutRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [initializeFacebookSDK]);

    useEffect(() => {
        const handleFocus = () => initializeFacebookSDK();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [initializeFacebookSDK]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                initializeFacebookSDK();
            }
        }, { threshold: 0.1 });

        const buttonElement = document.querySelector('[data-fb-button="true"]');
        if (buttonElement) observer.observe(buttonElement);

        return () => {
            if (buttonElement) observer.unobserve(buttonElement);
        };
    }, [initializeFacebookSDK]);

    const handleFacebookLogin = async () => {
        onInteractionStart();
        setIsLoading(true);

        if (!window.FB) {
            initializeFacebookSDK();

            setTimeout(() => {
                if (!window.FB) {
                    onFacebookError('Facebook login is not available. It might be blocked by your browser or extensions.');
                    setIsLoading(false);
                    onInteractionEnd();
                    return;
                } else {
                    proceedWithFacebookLogin({label});
                }
            }, 1000);
        } else {
            proceedWithFacebookLogin({label});
        }
    };

    const proceedWithFacebookLogin = ({label}) => {
        const popupTimeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                onFacebookError('Facebook sign-in was cancelled or timed out.');
                onInteractionEnd();
            }
        }, 60000);

        try {
            window.FB?.login((response: FacebookLoginStatusResponse) => {
                clearTimeout(popupTimeout);

                if (response.status === 'connected' && response.authResponse) {
                    const accessToken = response.authResponse.accessToken;

                    window.FB?.api(
                        '/me',
                        {
                            fields: 'id,name,email,picture,first_name,last_name,gender,birthday,location,link,about,hometown,locale'
                        },
                        function (profileData) {
                            console.log('Facebook profile:', profileData);
                        }
                    );

                    handleFacebookSuccess(accessToken);
                } else {
                    setIsLoading(false);
                    onFacebookError('Facebook login was cancelled');
                    onInteractionEnd();
                }
            }, {
                scope: 'public_profile,email',
                return_scopes: true
            });
        } catch (error: any) {
            clearTimeout(popupTimeout);
            setError('root.serverError', {
                type: 'server',
                message: 'Facebook sign in failed',
            });
            onFacebookError('Facebook sign in failed. Please try again.');
            setIsLoading(false);
            onInteractionEnd();
        }
    };

    return (
        <Button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isLoading || disabled}
            data-fb-button="true "
            className={`w-full bg-white hover:bg-gray-200 border-gray-300 text-[#3c4043] ${
                (isLoading || disabled)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white border hover:bg-[#4285f414]'
            }`}
        >
            {isLoading ? (
                'Processing...'
            ) : !window.FB ? (
                'Loading Facebook...'
            ) : (
                <>
                    <FaFacebook className="text-[#1877F2] !w-[18px] !h-[18px]" />
                    <span style={{fontWeight: 400, marginLeft: 4,
                        fontFamily: 'sans-serif'}}>{label || 'Login with Facebook'}</span>
                </>
            )}
        </Button>
    );
};

export default FacebookButton;
