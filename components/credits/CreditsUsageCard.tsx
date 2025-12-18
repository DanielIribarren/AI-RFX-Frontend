import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gem } from 'lucide-react';

interface CreditsUsageCardProps {
  creditsTotal: number;
  creditsUsed: number;
  resetDate: string;
  planName: string;
}

export function CreditsUsageCard({
  creditsTotal,
  creditsUsed,
  resetDate,
  planName
}: CreditsUsageCardProps) {
  const creditsRemaining = creditsTotal - creditsUsed;
  const percentageUsed = Math.min((creditsUsed / creditsTotal) * 100, 100);

  // Fecha formateada
  const formattedDate = new Date(resetDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Gem className="h-4 w-4" />
          Credits Usage
        </CardTitle>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600 uppercase tracking-wide">
          {planName} Plan
        </span>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">
              {creditsRemaining} available
            </span>
            <span className="text-gray-500">
              {creditsUsed} / {creditsTotal} used
            </span>
          </div>
          
          <Progress 
            value={percentageUsed} 
            className="h-2 bg-gray-100" 
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Resets on {formattedDate}
          </p>
          
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="h-8 border-gray-300 hover:bg-gray-50 text-gray-900">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
