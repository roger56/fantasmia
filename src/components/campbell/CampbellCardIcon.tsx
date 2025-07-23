import React from 'react';

interface CampbellCardIconProps {
  cardId: number;
  className?: string;
}

const CampbellCardIcon: React.FC<CampbellCardIconProps> = ({ cardId, className = "w-8 h-8" }) => {
  // Custom SVG icons for Campbell cards
  const icons = {
    1: ( // Tree and book - Il mondo di tutti i giorni
      <div className={`${className} bg-amber-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-600" fill="currentColor">
          <path d="M12 3L8 7h3v10h2V7h3l-4-4z"/>
          <path d="M5 19h14v2H5z"/>
        </svg>
      </div>
    ),
    2: ( // House - Qualcosa lo chiama
      <div className={`${className} bg-orange-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
    ),
    3: ( // Person covering face - Non vuole partire
      <div className={`${className} bg-red-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11S11 10.1 11 9V7.5L5 7V9C5 10.1 4.1 11 3 11S1 10.1 1 9V7L7 6.5V9C7 11.2 8.8 13 11 13H13C15.2 13 17 11.2 17 9V6.5L23 7V9C23 10.1 22.1 11 21 11Z"/>
        </svg>
      </div>
    ),
    4: ( // Old man with lantern - Un incontro che cambia tutto
      <div className={`${className} bg-purple-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" fill="currentColor">
          <path d="M9 11H7v9a2 2 0 002 2h6a2 2 0 002-2v-9h-2m1-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3M9 11h6m-3-7a3 3 0 00-3 3v4h6V7a3 3 0 00-3-3z"/>
        </svg>
      </div>
    ),
    5: ( // Archway/doorway - La soglia del viaggio
      <div className={`${className} bg-blue-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
          <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/>
        </svg>
      </div>
    ),
    6: ( // Lightning with path - Prove, amici, nemici
      <div className={`${className} bg-yellow-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-600" fill="currentColor">
          <path d="M11,15H6L13,1V9H18L11,23V15Z"/>
        </svg>
      </div>
    ),
    7: ( // Heart with maze - Vicino al cuore del problema
      <div className={`${className} bg-pink-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-600" fill="currentColor">
          <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
        </svg>
      </div>
    ),
    8: ( // Dragon on mountain - La sfida centrale
      <div className={`${className} bg-green-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600" fill="currentColor">
          <path d="M14,6L10.25,11L13,17.75L15.75,11L12,6M16.94,5L12,0L7.06,5H0V11H7.06L12,16L16.94,11H24V5H16.94Z"/>
        </svg>
      </div>
    ),
    9: ( // Treasure chest - Una ricompensa inattesa
      <div className={`${className} bg-amber-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-600" fill="currentColor">
          <path d="M5,4A3,3 0 0,0 2,7V19A3,3 0 0,0 5,22H19A3,3 0 0,0 22,19V7A3,3 0 0,0 19,4H17V3A1,1 0 0,0 16,2H8A1,1 0 0,0 7,3V4H5M7,6H17V4H9V6M5,8H19V19H5V8M12,9L7,12L12,15L17,12L12,9Z"/>
        </svg>
      </div>
    ),
    10: ( // Compass on path - Strada del ritorno
      <div className={`${className} bg-indigo-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-indigo-600" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M15,9L12,11L9,15L12,13L15,9Z"/>
        </svg>
      </div>
    ),
    11: ( // Lightning bolt - Ultima prova
      <div className={`${className} bg-red-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
          <path d="M7,2V13H10V22L17,10H14L17,2H7Z"/>
        </svg>
      </div>
    ),
    12: ( // Sunrise - Il nuovo inizio
      <div className={`${className} bg-orange-100 rounded-full flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600" fill="currentColor">
          <path d="M3,12H7A5,5 0 0,1 12,7A5,5 0 0,1 17,12H21A1,1 0 0,1 22,13A1,1 0 0,1 21,14H3A1,1 0 0,1 2,13A1,1 0 0,1 3,12M15,1V4A1,1 0 0,1 14,5A1,1 0 0,1 13,4V1A1,1 0 0,1 14,0A1,1 0 0,1 15,1M6.64,2.64L8.05,4.05A1,1 0 0,1 8.05,5.46A1,1 0 0,1 6.64,5.46L5.23,4.05A1,1 0 0,1 5.23,2.64A1,1 0 0,1 6.64,2.64M18.77,2.64A1,1 0 0,1 20.18,2.64A1,1 0 0,1 20.18,4.05L18.77,5.46A1,1 0 0,1 17.36,5.46A1,1 0 0,1 17.36,4.05L18.77,2.64M2,11V13A1,1 0 0,1 1,14A1,1 0 0,1 0,13V11A1,1 0 0,1 1,10A1,1 0 0,1 2,11M24,11V13A1,1 0 0,1 23,14A1,1 0 0,1 22,13V11A1,1 0 0,1 23,10A1,1 0 0,1 24,11Z"/>
        </svg>
      </div>
    )
  };

  return icons[cardId as keyof typeof icons] || icons[1];
};

export default CampbellCardIcon;