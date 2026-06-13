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
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm select-none"
      >
        {/* Background Glow / Base */}
        <circle cx="250" cy="250" r="230" fill="transparent" />

        {/* 1. The Globe (Bottom Right Quadrant & Core) */}
        {/* Main Blue Circle representing the globe */}
        <path
          d="M 210 280 C 210 200, 270 170, 350 170 C 430 170, 470 230, 470 310 C 470 390, 400 450, 310 450 C 230 450, 210 370, 210 280 Z"
          fill="#0D5CA3"
        />

        {/* Globe Grid lines (Latitude & Longitude) */}
        {/* Longitude lines */}
        <path
          d="M 280 173 C 330 200, 330 400, 280 447"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 320 170 C 370 200, 370 400, 320 450"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 360 175 C 410 210, 410 390, 360 441"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 400 190 C 440 230, 440 370, 400 422"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.8"
        />
        
        {/* Latitude lines */}
        <path
          d="M 220 250 Q 320 220 445 220"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 211 295 Q 320 260, 465 270"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 215 345 Q 330 310, 458 335"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />
        <path
          d="M 240 395 Q 330 365, 422 402"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeOpacity="0.85"
        />

        {/* 2. Grey Arc Sweeps encircling the globe */}
        <path
          d="M 412 170 C 375 145, 335 145, 310 160 C 275 180, 260 215, 260 255 C 260 305, 280 345, 315 375 C 355 410, 405 400, 435 370"
          stroke="#7A7A7A"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 432 185 C 400 160, 360 160, 332 176 C 298 195, 283 230, 283 270 C 283 315, 303 355, 338 384 C 372 412, 415 405, 445 380"
          stroke="#9F9F9F"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* 3. Top Grey Swirl / Crown Accent */}
        <path
          d="M 220 190 Q 235 140 265 140 Q 295 140 290 110 T 260 70 Q 210 70 200 115 C 190 150, 205 175, 220 190 Z"
          fill="#8A8A8A"
        />
        <path
          d="M 220 190 C 205 175, 190 150, 200 115 Q 210 70 260 70 Q 290 70, 300 95 C 310 120, 290 145, 260 155 Q 240 160, 220 190 Z"
          fill="#7A7A7A"
        />

        {/* 4. The Giant Red Stylized Symbol (Arabic Ayn 'ع' or Wing) */}
        {/* Main curved path with 3-dimensional sweep */}
        <path
          d="M 120 5 C 130 50, 160 100, 210 160 C 280 240, 370 240, 480 50 C 410 110, 340 180, 250 180 C 180 180, 150 160, 150 110 L 150 300 C 150 380, 90 420, 20 405 C 100 480, 230 400, 230 330 C 230 260, 110 200, 120 5 Z"
          fill="#D31D24"
        />
        {/* Inner Highlight for Depth */}
        <path
          d="M 125 15 C 133 55, 161 95, 205 155 C 270 225, 350 220, 440 68 C 380 118, 320 170, 245 170 C 183 170, 158 152, 158 110"
          stroke="#E5474D"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* 5. Extra Base Accent Sweeps (Bottom Left and Right) */}
        <path
          d="M 190 435 C 240 475, 310 475, 360 450"
          stroke="#7A7A7A"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 270 470 C 310 480, 350 475, 390 445"
          stroke="#0D5CA3"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <div className="flex flex-col select-none">
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
