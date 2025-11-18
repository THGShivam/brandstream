# Translation Components

This directory contains modular, reusable components for translating ad copy to different European languages.

## Components

### LanguageSelect
A searchable dropdown component for selecting target languages.

**Features:**
- 20 most commonly used European languages
- Search functionality to filter languages
- Professional, accessible UI with keyboard navigation
- Disabled state support

**Usage:**
```tsx
import { LanguageSelect } from "@/components/translation"

<LanguageSelect
  value={selectedLanguage}
  onChange={setSelectedLanguage}
  disabled={isTranslating}
/>
```

### TranslationControls
A complete translation control panel with language selection and translate button.

**Features:**
- Integrated language selection
- Translate button with loading states
- Error handling and display
- Context-aware translation using Vertex AI
- Maintains copy structure (headline, body_text, call_to_action)

**Usage:**
```tsx
import { TranslationControls } from "@/components/translation"

<TranslationControls
  copyText={{
    headline: "Your headline",
    body_text: "Your body text",
    call_to_action: "Your CTA"
  }}
  variationNumber={1}
  onTranslationComplete={(translatedCopy) => {
    // Handle translated copy
    console.log(translatedCopy)
  }}
/>
```

## Supported Languages

The component supports 20 European languages:
- Spanish, French, German, Italian, Portuguese
- Dutch, Polish, Romanian, Czech, Greek
- Hungarian, Swedish, Danish, Finnish, Norwegian
- Croatian, Bulgarian, Slovak, Lithuanian, Slovenian

## API Integration

Translation is powered by Vertex AI (Gemini 2.5 Pro) through the `/api/translate` endpoint.

The API maintains context and preserves:
- Tone and style
- Brand names and proper nouns
- Emotional impact
- Marketing intent
- Cultural appropriateness

## Styling

Components use Tailwind CSS and follow the application's design system with:
- Purple/pink gradient accents
- Dark slate background theme
- Smooth transitions and hover effects
- Professional, modern UI
