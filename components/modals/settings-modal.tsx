"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useSettings } from "@/hooks/use-settings";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";

export const SettingsModal = () => {
  const settings = useSettings();

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent className="p-6">
        {/* Header */}
        <DialogHeader className="border-b pb-3 mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            My Settings
          </h2>
        </DialogHeader>

        {/* Appearance Settings */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label className="text-gray-800 dark:text-gray-200">
              Appearance
            </Label>
            <span className="text-sm text-muted-foreground dark:text-gray-400">
              Customize how Jotion looks on your device
            </span>
          </div>
          <ModeToggle />
        </div>
      </DialogContent>
    </Dialog>
  );
};
