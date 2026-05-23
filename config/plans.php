<?php

return [
    'free' => [
        'name' => 'Free',
        'price' => 0,
        'limits' => [
            'daily_ops' => 5,
            'max_file_size' => 20, // MB
            'ai_tools' => false,
            'team_members' => 0,
        ],
    ],
    'pro' => [
        'name' => 'Pro',
        'price' => 9.99,
        'id' => 'price_pro_monthly', // Stripe/Paystack ID
        'limits' => [
            'daily_ops' => 100,
            'max_file_size' => 100, // MB
            'ai_tools' => true,
            'team_members' => 1,
        ],
    ],
    'business' => [
        'name' => 'Business',
        'price' => 29.99,
        'id' => 'price_business_monthly',
        'limits' => [
            'daily_ops' => -1, // unlimited
            'max_file_size' => 500, // MB
            'ai_tools' => true,
            'team_members' => 10,
        ],
    ],
];
