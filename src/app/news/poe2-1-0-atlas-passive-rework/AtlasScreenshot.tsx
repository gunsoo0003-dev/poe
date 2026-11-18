"use client";
import { useState } from 'react';

type Props = { src: string; alt: string; width: number; height: number; };
/** Never substitute a different scene when an Atlas screenshot fails to load. */
export default function AtlasScreenshot({ src, alt, width, height }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="status" style={{border:"1px solid #746c60",padding:"1.25rem",textAlign:"center",color:"#c8b9a1"}}>
    아틀라스 게임 화면을 불러오지 못했습니다. 아래 출처 링크에서 원본을 확인할 수 있습니다.
  </div>;
  return <img src={src} alt={alt} width={width} height={height} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
