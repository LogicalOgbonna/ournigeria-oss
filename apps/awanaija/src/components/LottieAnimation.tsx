"use client";

import dynamic from "next/dynamic";
import { type ComponentProps } from "react";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false }
);

interface LottieAnimationProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: ComponentProps<"div">["style"];
}

export function LottieAnimation({
  src,
  className,
  loop = true,
  autoplay = true,
  style,
}: LottieAnimationProps) {
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}
