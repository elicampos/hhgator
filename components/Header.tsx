import React from 'react';
import { PieChart } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Examlytics
          </span>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium text-slate-500">
          {/* Navigation links removed as requested */}
        </div>
      </div>
    </header>
  );
};

export default Header;