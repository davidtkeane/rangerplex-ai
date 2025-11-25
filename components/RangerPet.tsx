import React, { useState, useEffect } from 'react';

interface RangerPetProps {
    isVisible: boolean;
    onClose: () => void;
    message: string;
}

const RangerPet: React.FC<RangerPetProps> = ({ isVisible, onClose, message }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isVisible) {
            setAnimationClass('animate-pop-in');
            // Automatically hide after a few seconds
            const timer = setTimeout(() => {
                setAnimationClass('animate-pop-out');
                // Allow time for fade-out animation before truly closing
                setTimeout(onClose, 500);
            }, 3000); // Show for 3 seconds

            return () => clearTimeout(timer);
        } else {
            setAnimationClass('');
        }
    }, [isVisible, onClose]);

    if (!isVisible && animationClass === '') return null;

    return (
        <div className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${animationClass}`}>
            <div className="bg-gradient-to-br from-purple-700 to-indigo-900 border border-purple-500 rounded-lg shadow-lg p-4 flex items-center space-x-4 text-white">
                <img
                    src="/assets/pets/cyber_cat_idle_animated.gif"
                    alt="Ranger Pet"
                    className="w-16 h-16 rounded-full border-2 border-purple-300 object-cover"
                    style={{ imageRendering: 'pixelated' }}
                />
                <div>
                    <p className="font-bold text-lg">Ranger Pet</p>
                    <p className="text-sm">{message}</p>
                </div>
                <button onClick={onClose} className="absolute top-1 right-1 text-purple-200 hover:text-white">
                    <i className="fa-solid fa-times"></i>
                </button>
            </div>
        </div>
    );
};

export default RangerPet;
