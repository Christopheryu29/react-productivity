"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { SearchCommand } from "@/components/search-command";
import { PomodoroTimer } from "./_components/pomodorotimer";
import { Navigation } from "./_components/navigation";
import React, { useState } from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isPomodoroVisible, setPomodoroVisible] = useState(false);

  const togglePomodoro = () => {
    setPomodoroVisible(!isPomodoroVisible);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/");
  }

  return (
    <div className="h-full flex dark:bg-[#1F1F1F]">
      <Navigation togglePomodoro={togglePomodoro} />
      <main className="flex-1 h-full overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
      {isPomodoroVisible && <PomodoroTimer />}
    </div>
  );
};

export default MainLayout;
