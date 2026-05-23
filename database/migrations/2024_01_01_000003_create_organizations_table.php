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
            $table->foreignId('owner_id')->constrained('users');
            $table->timestamps();
        });

        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role')->default('member'); // owner, admin, member
            $table->timestamps();
        });

        Schema::table('tool_jobs', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->constrained();
        });
    }

    public function down()
    {
        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
        Schema::table('tool_jobs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organization_id');
        });
    }
};
