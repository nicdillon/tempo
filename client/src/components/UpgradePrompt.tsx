import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CrownIcon } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  className?: string;
}

export function UpgradePrompt({ className }: UpgradePromptProps) {
  return (
    <Card className={`bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CrownIcon className="h-6 w-6 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Unlock Premium Features</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Upgrade to save your timer sessions, access detailed analytics,
                and more.
              </p>
            </div>
            <div className="mt-4">
              <Button asChild className="bg-amber-500 hover:bg-amber-600">
                <Link href="/subscribe">Upgrade Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
