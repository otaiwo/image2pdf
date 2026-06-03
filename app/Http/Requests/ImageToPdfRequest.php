<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImageToPdfRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $options = $this->input('options');

        if (is_string($options)) {
            $decodedOptions = json_decode($options, true);
            $options = is_array($decodedOptions) ? $decodedOptions : $options;
        }

        if (is_array($options)) {
            $this->merge([
                'options' => array_merge($options, [
                    'pageSize' => isset($options['pageSize']) ? strtolower((string) $options['pageSize']) : null,
                    'orientation' => isset($options['orientation']) ? strtolower((string) $options['orientation']) : null,
                ]),
            ]);
        }
    }

    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'images' => 'required|array|min:1|max:20',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp,bmp|max:10240',
            'options' => 'nullable|array',
            'options.pageSize' => 'nullable|string|in:a0,a1,a2,a3,a4,a5,a6,letter,legal',
            'options.orientation' => 'nullable|string|in:portrait,landscape',
            'options.quality' => 'nullable|integer|min:1|max:100',
            'options.compression' => 'nullable|boolean',
        ];
    }

    public function messages()
    {
        return [
            'images.required' => 'Please upload at least one image',
            'images.array' => 'Images must be an array',
            'images.min' => 'At least 1 image is required',
            'images.max' => 'Maximum 20 images allowed',
            'images.*.required' => 'All image slots must be filled',
            'images.*.image' => 'Each file must be a valid image',
            'images.*.mimes' => 'Allowed formats: JPEG, PNG, GIF, WebP, BMP',
            'images.*.max' => 'Each image must not exceed 10MB',
            'options.json' => 'Options must be valid JSON',
            'options.pageSize.in' => 'Invalid page size selected',
            'options.orientation.in' => 'Orientation must be portrait or landscape',
            'options.quality.min' => 'Quality must be at least 1',
            'options.quality.max' => 'Quality cannot exceed 100',
        ];
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);
        
        // Parse options if provided as JSON string
        if (isset($data['options']) && is_string($data['options'])) {
            $data['options'] = json_decode($data['options'], true) ?? [];
        } elseif (!isset($data['options'])) {
            $data['options'] = [];
        }

        return $data;
    }
}
