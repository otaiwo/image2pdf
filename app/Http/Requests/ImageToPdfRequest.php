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
            // Options can be provided as an array or a JSON string
            'options' => 'required',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp,bmp|max:10240',
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
