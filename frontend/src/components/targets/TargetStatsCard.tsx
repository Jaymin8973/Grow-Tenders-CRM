
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';;

export function TargetStatsCard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['target-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/targets/my-stats');
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse h-32 bg-muted rounded-lg w-full"></div>
                ))}
            </div>
        );
    }

    const target = stats?.target || 0;
    const achieved = stats?.achieved || 0;
    const pending = stats?.pending || 0;
    const percentage = stats?.percentage || 0;
    const monthName = stats?.month ? new Date(stats.month).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Current Month';


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Target Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Monthly Target
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(target)}</div>
                    <p className="text-xs text-muted-foreground">
                        Goal for {monthName}
                    </p>
                </CardContent>
            </Card>

            {/* Achieved Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Achieved
                    </CardTitle>
                    <TrendingUp className={`h-4 w-4 ${percentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${percentage >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {formatCurrency(achieved)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Confirmed payments
                    </p>
                </CardContent>
            </Card>

            {/* Pending Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Pending
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(pending)}</div>
                    <p className="text-xs text-muted-foreground">
                        Remaining to reach goal
                    </p>
                </CardContent>
            </Card>

            {/* Percentage Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Progress
                    </CardTitle>
                    <Percent className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{percentage}%</div>
                    <p className="text-xs text-muted-foreground">
                        Of monthly target
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
