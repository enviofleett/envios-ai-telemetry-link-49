
import React from 'react';

interface ModernSplitScreenLoginLayoutProps {
  children: React.ReactNode;
}

const ModernSplitScreenLoginLayout: React.FC<ModernSplitScreenLoginLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Gradient Background with Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Admin Control
              <br />
              <span className="text-white/90">Center</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-md">
              Manage your entire fleet with intelligent insights and real-time tracking powered by GP51 technology.
            </p>
          </div>

          <div className="space-y-4 text-white/70">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Real-time vehicle monitoring</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Advanced analytics dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Secure GP51 integration</span>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Mobile Header for smaller screens */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">EnvioFleet Admin</h1>
          <p className="text-gray-600">Fleet Management Control Center</p>
        </div>
      </div>
    </div>
  );
};

export default ModernSplitScreenLoginLayout;
