'use client';

import { useState } from 'react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { Check, X, CreditCard, MapPin, Tag } from 'lucide-react';
import { SUBSCRIPTION_PLANS, calculateWithGST } from '@/lib/plans';
import { GEM_CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';
import { INDIAN_STATES } from '@/lib/states';
import { formatCurrency } from '@/lib/utils';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => void;
}

export interface CustomerFormData {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    industry: string;
    gstin?: string;
    contactPerson?: string;
    address?: string;
    subscriptionPlan: string;
    categories: string[];
    states: string[];
    alertFrequency: 'daily' | 'weekly' | 'realtime';
}

export function AddCustomerModal({ isOpen, onClose, onSubmit }: AddCustomerModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<CustomerFormData>>({
        subscriptionPlan: 'standard',
        categories: [],
        states: [],
        alertFrequency: 'daily',
    });

    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formData.subscriptionPlan);
    const pricing = selectedPlan ? calculateWithGST(selectedPlan.price) : null;

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        if (formData.name && formData.email && formData.industry) {
            onSubmit(formData as CustomerFormData);
            setStep(1);
            setFormData({
                subscriptionPlan: 'standard',
                categories: [],
                states: [],
                alertFrequency: 'daily',
            });
        }
    };

    const toggleCategory = (categoryId: string) => {
        const current = formData.categories || [];
        const maxAllowed = selectedPlan?.maxCategories || 3;

        if (current.includes(categoryId)) {
            setFormData({ ...formData, categories: current.filter(c => c !== categoryId) });
        } else if (maxAllowed === -1 || current.length < maxAllowed) {
            setFormData({ ...formData, categories: [...current, categoryId] });
        }
    };

    const toggleState = (stateCode: string) => {
        const current = formData.states || [];
        const maxAllowed = selectedPlan?.maxStates || 2;

        if (current.includes(stateCode)) {
            setFormData({ ...formData, states: current.filter(s => s !== stateCode) });
        } else if (maxAllowed === -1 || current.length < maxAllowed) {
            setFormData({ ...formData, states: [...current, stateCode] });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 1 ? "Customer Details" : step === 2 ? "Select Plan" : "Tender Preferences"}
            size="xl"
            footer={
                <>
                    {step > 1 && (
                        <Button variant="secondary" onClick={handleBack}>Back</Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    {step < 3 ? (
                        <Button onClick={handleNext}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit}>Create Customer</Button>
                    )}
                </>
            }
        >
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}>
                            {s < step ? <Check size={16} /> : s}
                        </div>
                        {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Company Name"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-2"
                        required
                    />
                    <Input
                        label="Contact Person"
                        value={formData.contactPerson || ''}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                        label="GSTIN"
                        value={formData.gstin || ''}
                        onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                    />
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Industry</label>
                        <select
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                            value={formData.industry || ''}
                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        >
                            <option value="">Select Industry</option>
                            {CATEGORY_GROUPS.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Website"
                        value={formData.website || ''}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        className="col-span-2"
                    />
                </div>
            )}

            {/* Step 2: Plan Selection */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {SUBSCRIPTION_PLANS.map(plan => {
                            const isSelected = formData.subscriptionPlan === plan.id;
                            const priceInfo = calculateWithGST(plan.price);

                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id, categories: [], states: [] })}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                        }`}
                                >
                                    {plan.popular && (
                                        <Badge variant="info" className="absolute -top-2 right-2">Popular</Badge>
                                    )}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        {isSelected && <Check className="text-orange-500" size={20} />}
                                    </div>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {formatCurrency(plan.price)}
                                        <span className="text-sm font-normal text-gray-500">/month</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-3">
                                        +GST: {formatCurrency(priceInfo.total)}
                                    </div>
                                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>• {plan.maxCategories === -1 ? 'Unlimited' : plan.maxCategories} categories</li>
                                        <li>• {plan.maxStates === -1 ? 'All India' : `${plan.maxStates} states`}</li>
                                    </ul>
                                </div>
                            );
                        })}
                    </div>

                    {pricing && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Subtotal</span>
                                <span>{formatCurrency(pricing.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>GST (18%)</span>
                                <span>{formatCurrency(pricing.gst)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-2">
                                <span>Total</span>
                                <span className="text-orange-600">{formatCurrency(pricing.total)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Categories & States */}
            {step === 3 && (
                <div className="space-y-6">
                    {/* Categories */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Tag size={18} className="text-orange-500" />
                                <h3 className="font-medium">Tender Categories</h3>
                            </div>
                            <span className="text-sm text-gray-500">
                                {formData.categories?.length || 0} / {selectedPlan?.maxCategories === -1 ? '∞' : selectedPlan?.maxCategories}
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                            {CATEGORY_GROUPS.map(group => (
                                <div key={group}>
                                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{group}</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {GEM_CATEGORIES.filter(c => c.group === group).map(cat => {
                                            const isSelected = formData.categories?.includes(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`px-2 py-1 text-xs rounded-full transition-colors ${isSelected
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* States */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-orange-500" />
                                <h3 className="font-medium">States for Tenders</h3>
                            </div>
                            <span className="text-sm text-gray-500">
                                {formData.states?.length || 0} / {selectedPlan?.maxStates === -1 ? '∞' : selectedPlan?.maxStates}
                            </span>
                        </div>
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                            <div className="flex flex-wrap gap-1.5">
                                {INDIAN_STATES.map(state => {
                                    const isSelected = formData.states?.includes(state.code);
                                    return (
                                        <button
                                            key={state.code}
                                            type="button"
                                            onClick={() => toggleState(state.code)}
                                            className={`px-2 py-1 text-xs rounded-full transition-colors ${isSelected
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {state.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Alert Frequency */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Alert Frequency</label>
                        <div className="flex gap-3">
                            {(['daily', 'weekly', 'realtime'] as const).map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, alertFrequency: freq })}
                                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${formData.alertFrequency === freq
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
