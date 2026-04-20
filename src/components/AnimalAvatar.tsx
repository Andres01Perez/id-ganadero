import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import jpsLogo from "@/assets/jps-logo.webp";

type Props = {
  src: string | null;
  alt: string;
  size?: "sm" | "md";
};

const AnimalAvatar = ({ src, alt, size = "md" }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const sizeClass = size === "sm" ? "w-14 h-14" : "w-16 h-16";
  const fallbackSize = size === "sm" ? "w-8 h-8" : "w-9 h-9";

  return (
    <div
      className={`${sizeClass} relative rounded-full border-[3px] border-gold bg-white overflow-hidden flex items-center justify-center shrink-0`}
    >
      {src && !errored ? (
        <>
          {!loaded && (
            <Skeleton className="absolute inset-0 rounded-full" />
          )}
          <img
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            decoding="async"
          />
        </>
      ) : (
        <img
          src={jpsLogo}
          alt=""
          className={`${fallbackSize} object-contain opacity-70`}
        />
      )}
    </div>
  );
};

export default AnimalAvatar;
