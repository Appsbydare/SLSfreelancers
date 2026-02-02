'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdCarouselProps {
  images: string[];
  interval?: number; // in milliseconds
}

export default function AdCarousel({ images, interval = 10000 }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 500); // Half of the transition duration
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black rounded-xl" style={{ minHeight: '100px' }}>
      <div className="relative w-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`w-full transition-all duration-1000 ease-in-out ${index === currentIndex
                ? 'opacity-100 scale-100 relative'
                : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
              }`}
          >
            <div className="relative w-full" style={{ minHeight: '200px' }}>
              <Image
                src={image}
                alt={`Advertisement ${index + 1}`}
                fill
                className="object-contain"
                priority={index === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Indicator Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(index);
                  setIsTransitioning(false);
                }, 500);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                  ? 'bg-brand-green w-8'
                  : 'bg-gray-400 hover:bg-gray-300'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows (optional - hidden on small screens) */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
                setIsTransitioning(false);
              }, 500);
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-300 hover:scale-110 hidden md:block z-10"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
                setIsTransitioning(false);
              }, 500);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-300 hover:scale-110 hidden md:block z-10"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

