import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface GoogleButtonProps {
    onSuccess: (token: string) => void;
    onError?: (message: string) => void;
    disabled?: boolean;
}

export default function GoogleButton({
                                         onSuccess,
                                         onError = () => {},
                                     }: GoogleButtonProps) {
    return (
        <GoogleLogin
            logo_alignment={'center'}
            onSuccess={(credentialResponse: CredentialResponse) => {
                const token = credentialResponse.credential;
                if (token) {
                    onSuccess(token);
                } else {
                    onError("Missing credential in Google response.");
                }
            }}
            onError={() => {
                onError("Google login failed");
            }}
            useOneTap // Optional: use Google One Tap login
        />
    );
}
