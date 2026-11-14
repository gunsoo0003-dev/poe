"use client";
import { useState } from 'react';

type Props = { src: string; alt: string; fallbackSrc?: string; width: number; height: number; className?: string; loading?: 'eager'|'lazy'; };
/** Official PR assets are served by GGG's PR provider; use an existing local GGG game asset when unreachable. */
export default function OfficialArtwork({src,alt,fallbackSrc='/images/poe2/official-burning-village.webp',width,height,className,loading='lazy'}: Props) {
  const [activeSrc,setActiveSrc]=useState(src);
  return <img className={className} src={activeSrc} alt={alt} width={width} height={height} loading={loading} onError={() => {if(activeSrc!==fallbackSrc)setActiveSrc(fallbackSrc)}} />;
}
