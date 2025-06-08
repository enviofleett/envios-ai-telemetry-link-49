
import React from 'react';
import {
  Car,
  Brain,
  GraduationCap,
  Zap,
  Network,
  Activity,
  BarChart3,
  Globe,
  Cpu,
} from 'lucide-react';

const AIBrandingPanel: React.FC = () => {
  return (
    <div className="hidden lg:block space-y-8 text-white">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl">
              <Car className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-green-400 rounded-full">
              <Cpu className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Envio
            </h1>
            <p className="text-xl text-blue-200">Vehicle Management System</p>
            <p className="text-sm text-blue-300 mt-1">Helps vehicles think, learn and act</p>
          </div>
        </div>

        {/* AI Capabilities Visualization */}
        <div className="relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto p-3 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <Brain className="h-8 w-8 text-purple-300" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-200">Think</h3>
                <p className="text-xs text-purple-300">AI-powered decision making</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto p-3 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <GraduationCap className="h-8 w-8 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-200">Learn</h3>
                <p className="text-xs text-blue-300">Adaptive algorithms</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto p-3 bg-green-500/20 rounded-xl border border-green-400/30">
                <Zap className="h-8 w-8 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-green-200">Act</h3>
                <p className="text-xs text-green-300">Autonomous responses</p>
              </div>
            </div>
          </div>

          {/* Connection lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Network className="h-16 w-16 text-white/10" />
          </div>
        </div>

        <p className="text-lg text-blue-100 leading-relaxed">
          Transform your fleet with intelligent vehicle management. Our AI-driven platform enables vehicles to make
          smart decisions, learn from patterns, and take autonomous actions for optimal performance.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30">
            <Activity className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Real-time Intelligence</h3>
            <p className="text-blue-200">AI monitors and optimizes vehicle performance in real-time</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
            <BarChart3 className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Predictive Analytics</h3>
            <p className="text-blue-200">Machine learning predicts maintenance needs and route optimization</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
            <Globe className="h-6 w-6 text-green-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Connected Ecosystem</h3>
            <p className="text-blue-200">Seamless integration across your entire vehicle network</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBrandingPanel;
