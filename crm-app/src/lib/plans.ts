// Grow Tenders Subscription Plans
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;          // Monthly price in INR
    duration: number;       // Duration in months
    maxCategories: number;  // Max categories allowed
    maxStates: number;      // Max states allowed
    features: string[];
    popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic',
        price: 999,
        duration: 1,
        maxCategories: 3,
        maxStates: 2,
        features: [
            'Up to 3 tender categories',
            'Up to 2 states coverage',
            'Daily email alerts',
            'Basic tender details',
            'Email support',
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        price: 2499,
        duration: 1,
        maxCategories: 10,
        maxStates: 5,
        features: [
            'Up to 10 tender categories',
            'Up to 5 states coverage',
            'Daily email alerts',
            'Detailed tender information',
            'Priority support',
            'Tender deadline reminders',
        ],
        popular: true,
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 4999,
        duration: 1,
        maxCategories: 25,
        maxStates: 15,
        features: [
            'Up to 25 tender categories',
            'Up to 15 states coverage',
            'Real-time alerts',
            'Complete tender documents',
            'Dedicated account manager',
            'Tender analysis reports',
            'WhatsApp alerts',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 9999,
        duration: 1,
        maxCategories: -1,  // Unlimited
        maxStates: -1,      // Unlimited
        features: [
            'Unlimited categories',
            'All India coverage',
            'Real-time alerts',
            'Complete tender documents',
            'Dedicated account manager',
            'Custom tender reports',
            'API access',
            'Multi-user access',
            'WhatsApp + SMS alerts',
        ],
    },
];

// GST Configuration
export const GST_RATE = 18; // 18% GST

// Calculate total with GST
export function calculateWithGST(amount: number) {
    const gstAmount = (amount * GST_RATE) / 100;
    return {
        subtotal: amount,
        gst: gstAmount,
        total: amount + gstAmount,
    };
}

// Get plan by ID
export function getPlanById(planId: string) {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId);
}

// Check if plan allows category/state
export function canAddCategory(plan: SubscriptionPlan, currentCount: number) {
    return plan.maxCategories === -1 || currentCount < plan.maxCategories;
}

export function canAddState(plan: SubscriptionPlan, currentCount: number) {
    return plan.maxStates === -1 || currentCount < plan.maxStates;
}
