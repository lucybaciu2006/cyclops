import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        </div>
    );
};

export default LoadingScreen;
