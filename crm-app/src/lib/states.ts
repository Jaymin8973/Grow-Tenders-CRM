// All Indian States and Union Territories
export const INDIAN_STATES = [
    // States
    { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT' },
    { code: 'AP', name: 'Andhra Pradesh', type: 'State' },
    { code: 'AR', name: 'Arunachal Pradesh', type: 'State' },
    { code: 'AS', name: 'Assam', type: 'State' },
    { code: 'BR', name: 'Bihar', type: 'State' },
    { code: 'CH', name: 'Chandigarh', type: 'UT' },
    { code: 'CG', name: 'Chhattisgarh', type: 'State' },
    { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
    { code: 'DL', name: 'Delhi', type: 'UT' },
    { code: 'GA', name: 'Goa', type: 'State' },
    { code: 'GJ', name: 'Gujarat', type: 'State' },
    { code: 'HR', name: 'Haryana', type: 'State' },
    { code: 'HP', name: 'Himachal Pradesh', type: 'State' },
    { code: 'JK', name: 'Jammu and Kashmir', type: 'UT' },
    { code: 'JH', name: 'Jharkhand', type: 'State' },
    { code: 'KA', name: 'Karnataka', type: 'State' },
    { code: 'KL', name: 'Kerala', type: 'State' },
    { code: 'LA', name: 'Ladakh', type: 'UT' },
    { code: 'LD', name: 'Lakshadweep', type: 'UT' },
    { code: 'MP', name: 'Madhya Pradesh', type: 'State' },
    { code: 'MH', name: 'Maharashtra', type: 'State' },
    { code: 'MN', name: 'Manipur', type: 'State' },
    { code: 'ML', name: 'Meghalaya', type: 'State' },
    { code: 'MZ', name: 'Mizoram', type: 'State' },
    { code: 'NL', name: 'Nagaland', type: 'State' },
    { code: 'OD', name: 'Odisha', type: 'State' },
    { code: 'PY', name: 'Puducherry', type: 'UT' },
    { code: 'PB', name: 'Punjab', type: 'State' },
    { code: 'RJ', name: 'Rajasthan', type: 'State' },
    { code: 'SK', name: 'Sikkim', type: 'State' },
    { code: 'TN', name: 'Tamil Nadu', type: 'State' },
    { code: 'TS', name: 'Telangana', type: 'State' },
    { code: 'TR', name: 'Tripura', type: 'State' },
    { code: 'UP', name: 'Uttar Pradesh', type: 'State' },
    { code: 'UK', name: 'Uttarakhand', type: 'State' },
    { code: 'WB', name: 'West Bengal', type: 'State' },
];

// Separate states and UTs for filtering
export const STATES_ONLY = INDIAN_STATES.filter(s => s.type === 'State');
export const UNION_TERRITORIES = INDIAN_STATES.filter(s => s.type === 'UT');

// Helper function to get state by code
export function getStateByCode(code: string) {
    return INDIAN_STATES.find(s => s.code === code);
}
