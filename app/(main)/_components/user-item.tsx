"use client";

import { ChevronsLeftRight } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/clerk-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserItem = () => {
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          className="flex items-center text-sm p-3 w-full hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          <div className="gap-x-2 flex items-center max-w-[150px]">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user?.imageUrl} />
            </Avatar>
            <span className="text-start font-medium line-clamp-1 dark:text-gray-200 text-gray-800">
              {user?.fullName}&apos;s Jotion
            </span>
          </div>
          <ChevronsLeftRight className="rotate-90 ml-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 bg-white dark:bg-gray-800 dark:text-gray-200"
        align="start"
        alignOffset={11}
        forceMount
      >
        <div className="flex flex-col space-y-4 p-2">
          <p className="text-xs font-medium leading-none text-gray-600 dark:text-gray-400">
            {user?.emailAddresses[0].emailAddress}
          </p>
          <div className="flex items-center gap-x-2">
            <div className="rounded-md bg-gray-100 dark:bg-gray-700 p-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
              </Avatar>
            </div>
            <div className="space-y-1">
              <p className="text-sm line-clamp-1 dark:text-gray-200 text-gray-800">
                {user?.fullName}&apos;s Jotion
              </p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
        <DropdownMenuItem
          asChild
          className="w-full cursor-pointer text-gray-600 dark:text-gray-400"
        >
          <SignOutButton>Log out</SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
