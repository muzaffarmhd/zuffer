// components/Loading.tsx
"use client";
import React from 'react';

const Loading = () => {
  return (
    <div className="w-full h-[35rem] flex items-center justify-center bg-white text-black">
      <div className="loader">Loading...</div>
      <style jsx>{`
        .loader {
          border: 16px solid #f3f3f3;
          border-top: 16px solid #3498db;
          border-radius: 50%;
          width: 120px;
          height: 120px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;