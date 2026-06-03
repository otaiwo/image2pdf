<?php

namespace App\Policies;

use App\Models\User;

class AdminPolicy
{
    /**
     * Check if user has admin privileges.
     */
    public function isAdmin(User $user): bool
    {
        return $user->is_admin === true;
    }

    /**
     * Check if user can manage system.
     */
    public function manageSystem(User $user): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Check if user can view analytics.
     */
    public function viewAnalytics(User $user): bool
    {
        return $this->isAdmin($user);
    }
}
