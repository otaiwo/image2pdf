<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Organization::class, 'organization');
    }

    public function index(Request $request): JsonResponse
    {
        $organizations = $request->user()
            ->organizations()
            ->with('owner:id,name,email')
            ->withCount(['members', 'jobs'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $organizations,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:organizations,name',
        ]);

        $org = Organization::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . Str::random(8),
            'owner_id' => $request->user()->id,
        ]);

        $org->members()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json([
            'success' => true,
            'data' => $org->load('members'),
        ], 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        // Authorize is handled by middleware
        $this->authorize('view', $organization);

        $organization->load('members:id,name,email');

        return response()->json([
            'success' => true,
            'data' => [
                'organization' => $organization,
                'members' => $organization->members,
                'recent_jobs' => $organization->jobs()
                    ->with('user:id,name,email')
                    ->latest()
                    ->limit(10)
                    ->get(),
            ],
        ]);
    }
}
