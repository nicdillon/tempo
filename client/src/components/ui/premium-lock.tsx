import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon } from "lucide-react";
import { Link } from "wouter";

interface PremiumLockProps {
  title?: string;
  description?: string;
  className?: string;
}

export function PremiumLock({
  title = "Premium Feature",
  description = "This feature is available for premium members only. Upgrade your account to unlock all features.",
  className,
}: PremiumLockProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
            <LockIcon className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild className="bg-amber-500 hover:bg-amber-600">
            <Link href="/subscribe">Upgrade to Premium</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
