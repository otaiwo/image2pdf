<?php

namespace App\Providers;

use App\Models\Organization;
use App\Models\User;
use App\Policies\AdminPolicy;
use App\Policies\OrganizationPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Organization::class => OrganizationPolicy::class,
        User::class => AdminPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define gates
        \Illuminate\Support\Facades\Gate::define('admin', function (User $user) {
            return $user->is_admin === true;
        });

        \Illuminate\Support\Facades\Gate::define('viewAnalytics', function (User $user) {
            return $user->is_admin === true;
        });
    }
}
