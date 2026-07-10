/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 80, showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} dir="rtl">
      <img
        src="/logo.png"
        alt="وكالة عبعوب للسياحة والأسفار"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-sm select-none"
        referrerPolicy="no-referrer"
      />
      {showText && (
        <div className="flex flex-col select-none text-right">
          <span className="font-sans font-bold text-xl md:text-2xl text-slate-800 tracking-tight">
            وكالة عبعوب لسياحة والأسفار
          </span>
          <span className="font-mono text-[10px] md:text-xs text-red-500 font-semibold tracking-wider uppercase">
            ABOUB TRAVEL & TOURISM
          </span>
        </div>
      )}
    </div>
  );
};
