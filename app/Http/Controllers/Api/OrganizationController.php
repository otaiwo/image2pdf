<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()->organizations,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $org = Organization::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . rand(1000, 9999),
            'owner_id' => $request->user()->id,
        ]);

        $org->members()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json([
            'success' => true,
            'data' => $org,
        ]);
    }

    public function show(Organization $organization): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'organization' => $organization,
                'members' => $organization->members,
                'recent_jobs' => $organization->jobs()->latest()->limit(10)->get(),
            ],
        ]);
    }
}
