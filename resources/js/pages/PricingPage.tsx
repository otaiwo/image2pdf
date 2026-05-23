import React from "react";
import { Check, Zap, Shield, Crown } from "lucide-react";

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for quick document edits.",
        features: ["5 operations per day", "Up to 20MB file size", "Standard processing speed", "Community support"],
        buttonText: "Current Plan",
        highlight: false,
        icon: Zap
    },
    {
        name: "Pro",
        price: "$9.99",
        period: "/month",
        description: "For professionals who need more power.",
        features: ["Unlimited operations", "Up to 100MB file size", "AI Summary & Chat", "Priority processing", "No watermarks"],
        buttonText: "Upgrade to Pro",
        highlight: true,
        icon: Crown
    },
    {
        name: "Business",
        price: "$29.99",
        period: "/month",
        description: "For teams collaborating on documents.",
        features: ["Up to 10 team members", "Up to 500MB file size", "Full AI suite access", "Dedicated account manager", "Custom branding"],
        buttonText: "Contact Sales",
        highlight: false,
        icon: Shield
    }
];

const PricingPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Simple, transparent pricing</h1>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that's right for you. All plans include 256-bit encryption.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative p-8 rounded-3xl border flex flex-col ${
                            plan.highlight
                                ? "bg-white border-red-500 shadow-2xl scale-105 z-10"
                                : "bg-white border-gray-100 shadow-sm"
                        }`}
                    >
                        {plan.highlight && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                                Most Popular
                            </span>
                        )}

                        <div className="mb-8">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.highlight ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                                <plan.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                                {plan.period && <span className="ml-1 text-xl font-semibold text-gray-500">{plan.period}</span>}
                            </div>
                            <p className="mt-4 text-gray-500 text-sm leading-relaxed">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-grow">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start text-sm text-gray-600">
                                    <Check className={`h-5 w-5 mr-3 shrink-0 ${plan.highlight ? "text-red-600" : "text-green-500"}`} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button className={`w-full py-4 rounded-xl font-bold transition-all ${
                            plan.highlight
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}>
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-20 bg-gray-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-100">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Need a custom solution?</h3>
                    <p className="text-gray-600 mt-2">We offer enterprise-grade APIs and custom deployment options for large organizations.</p>
                </div>
                <button className="px-8 py-4 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 hover:bg-gray-50 transition-colors shadow-sm">
                    Talk to Enterprise
                </button>
            </div>
        </div>
    );
};

export default PricingPage;
