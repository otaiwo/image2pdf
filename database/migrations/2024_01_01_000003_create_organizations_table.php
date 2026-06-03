<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('owner_id');
        });

        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role')->default('member'); // owner, admin, member
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
            $table->index(['user_id', 'role']);
        });

        Schema::table('tool_jobs', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->index(['organization_id', 'status', 'created_at'], 'tool_jobs_org_status_created_idx');
        });
    }

    public function down()
    {
        Schema::table('tool_jobs', function (Blueprint $table) {
            $table->dropIndex('tool_jobs_org_status_created_idx');
            $table->dropConstrainedForeignId('organization_id');
        });
        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
    }
};
