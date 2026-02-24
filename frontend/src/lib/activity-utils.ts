export type ActivityStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type ActivityType =
    | 'CALL'
    | 'MEETING'
    | 'DEMO'
    | 'EMAIL'
    | 'TASK'
    | 'REMINDER'
    | 'FOLLOW_UP'
    | 'INVOICE'
    | 'PAYMENT'
    | 'LEAD';

export function activityStatusLabel(status: string) {
    switch (status) {
        case 'SCHEDULED':
            return 'Scheduled';
        case 'COMPLETED':
            return 'Completed';
        case 'CANCELLED':
            return 'Cancelled';
        case 'OVERDUE':
            return 'Overdue';
        default:
            return status;
    }
}

export function activityStatusBadgeClass(status: string) {
    switch (status) {
        case 'OVERDUE':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'COMPLETED':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'SCHEDULED':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'CANCELLED':
            return 'bg-gray-50 text-gray-700 border-gray-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
}

export function activityTypeLabel(type: string) {
    switch (type) {
        case 'CALL':
            return 'Call';
        case 'MEETING':
            return 'Meeting';
        case 'DEMO':
            return 'Demo';
        case 'EMAIL':
            return 'Email';
        case 'TASK':
            return 'Task';
        case 'REMINDER':
            return 'Reminder';
        case 'FOLLOW_UP':
            return 'Follow-up';
        case 'INVOICE':
            return 'Invoice';
        case 'PAYMENT':
            return 'Payment';
        case 'LEAD':
            return 'Lead';
        default:
            return type;
    }
}
