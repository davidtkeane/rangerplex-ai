# Grok Vision Implementation Guide

**Updated**: November 23, 2025
**Based on**: xAI API Official Specifications

---

## 🎯 Vision-Capable Models

The following Grok models support vision/multimodal inputs (images and videos):
- ✅ **`grok-2-vision`** - Grok 2 with vision capabilities
- ✅ **`grok-3`** - Latest flagship model with built-in multimodal support (RECOMMENDED)

---

## 📸 How to Send Images

### Method 1: Image URL (Preferred)
Most efficient method - provide a publicly accessible image URL.

```json
{
  "model": "grok-3",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Describe this image in detail."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ],
  "stream": true
}
```

### Method 2: Base64 Encoded Image
For local images or when URL isn't available.

```json
{
  "model": "grok-3",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
          }
        }
      ]
    }
  ],
  "stream": true
}
```

---

## 🎥 Video Support

Videos are supported in the same format as images (MP4 format recommended).

```json
{
  "model": "grok-3",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze the activity in this video."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/video.mp4"
          }
        }
      ]
    }
  ]
}
```

**Video Recommendations:**
- Resolution: ≤ 512x512 pixels (recommended)
- Format: MP4
- Size: ≤ 20MB

---

## 📏 Size Limits

### Images:
- **Maximum file size**: 20MB
- **Maximum resolution**: 2048x2048 pixels
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Base64**: Keep encoding efficient to avoid bloating requests

### Videos:
- **Maximum file size**: 20MB
- **Recommended resolution**: 512x512 pixels or lower
- **Format**: MP4 (preferred)

---

## 🔄 Multiple Images in One Request

You can send multiple images/videos in a single message:

```json
{
  "model": "grok-3",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Compare these two images and tell me the differences."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image1.jpg"
          }
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image2.jpg"
          }
        }
      ]
    }
  ]
}
```

---

## 💡 Implementation Tips

### 1. **Format Validation**
Validate images client-side before sending:
```typescript
const validateImage = (file: File): boolean => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    alert('Image must be ≤ 20MB');
    return false;
  }

  if (!validTypes.includes(file.type)) {
    alert('Supported formats: JPEG, PNG, GIF, WebP');
    return false;
  }

  return true;
};
```

### 2. **Resolution Check**
Check image dimensions before sending:
```typescript
const checkResolution = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isValid = img.width <= 2048 && img.height <= 2048;
      if (!isValid) {
        alert('Image resolution must be ≤ 2048x2048 pixels');
      }
      resolve(isValid);
    };
    img.src = URL.createObjectURL(file);
  });
};
```

### 3. **Base64 Encoding**
Efficient base64 encoding for local images:
```typescript
const encodeImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

### 4. **Message Format Helper**
Helper function to format vision messages:
```typescript
const formatVisionMessage = (
  text: string,
  imageUrls: string[]
): any => {
  const content: any[] = [
    { type: 'text', text }
  ];

  imageUrls.forEach(url => {
    content.push({
      type: 'image_url',
      image_url: { url }
    });
  });

  return {
    role: 'user',
    content
  };
};
```

---

## ⚠️ Important Notes

### Rate Limits:
- Rate limits apply **per image**, not per request
- Each image in a multi-image request counts toward limits
- Monitor your rate limit headers in responses

### Best Practices:
1. **Use URLs when possible** - More efficient than base64
2. **Validate before sending** - Check size and format client-side
3. **Compress large images** - Reduce size while maintaining quality
4. **Handle errors gracefully** - Provide clear error messages to users
5. **Show preview** - Display image preview before sending

### Error Handling:
```typescript
try {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    // ... request config
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      // Bad request - likely image format or size issue
      console.error('Image error:', error.error.message);
    } else if (response.status === 429) {
      // Rate limit - too many requests or images
      console.error('Rate limit exceeded');
    }
  }
} catch (error) {
  console.error('Vision API error:', error);
}
```

---

## 🔗 Integration with RangerPlex

To integrate vision support into RangerPlex's Grok implementation:

1. **Update `xaiService.ts`** to support multimodal content format
2. **Modify message formatting** to handle both text and image content
3. **Add UI components** for image upload/preview
4. **Implement validation** as shown in tips above
5. **Update model selector** to show 👁️ badge for vision models

---

## 📚 References

- xAI API Documentation: https://x.ai/api
- xAI Console: https://console.x.ai
- Model pricing and limits: Check xAI console for current rates

---

**Last Updated**: November 23, 2025
**Verified By**: Grok API (xAI)
**For**: RangerPlex AI v2.4.3

*Rangers lead the way!* 🎖️
