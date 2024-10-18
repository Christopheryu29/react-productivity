import Image from "next/image";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const Logo = () => {
  return (
    <div className="hidden md:flex items-center gap-x-2">
      {/* Logo for light mode */}
      <Image
        src="/logo.svg"
        height="40"
        width="40"
        alt="Logo"
        className="dark:hidden"
      />
      {/* Logo for dark mode */}
      <Image
        src="/logo-dark.svg"
        height="40"
        width="40"
        alt="Logo"
        className="hidden dark:block"
      />

      {/* JIFT text for light mode */}
      <p
        className={cn(
          "font-semibold text-gray-800", // Light mode color
          font.className,
          "dark:hidden" // Hidden in dark mode
        )}
      >
        JIFT
      </p>

      {/* JIFT text for dark mode */}
      <p
        className={cn(
          "font-semibold text-white", // Dark mode color
          font.className,
          "hidden dark:block" // Hidden in light mode
        )}
      >
        JIFT
      </p>
    </div>
  );
};
