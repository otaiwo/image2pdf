<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImageToPdfRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'images' => 'required|array|min:1|max:20',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp,bmp|max:10240',
            'options.orientation' => 'nullable|in:portrait,landscape',
            'options.format' => 'nullable|in:A4,A3,letter,legal',
            'options.quality' => 'nullable|integer|min:1|max:100',
        ];
    }

    public function messages()
    {
        return [
            'images.required' => 'Please upload at least one image',
            'images.*.image' => 'Each file must be a valid image',
            'images.*.max' => 'Each image must not exceed 10MB',
        ];
    }
}
