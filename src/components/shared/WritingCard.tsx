import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import SpeechToText from '@/components/SpeechToText';

interface WritingCardProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLines?: number;
  showSpeechToText?: boolean;
  onSpeechResult?: (text: string) => void;
}

const WritingCard: React.FC<WritingCardProps> = ({
  title,
  subtitle,
  value,
  onChange,
  placeholder = "Scrivi qui...",
  maxLines = 10,
  showSpeechToText = true,
  onSpeechResult
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleSpeechResult = (transcript: string) => {
    const newContent = value + (value ? ' ' : '') + transcript;
    onChange(newContent);
    onSpeechResult?.(transcript);
  };

  const maxHeight = maxLines * 20; // Approximate line height

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <p className="text-slate-600">{subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={showSpeechToText ? "flex gap-2" : ""}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none overflow-hidden"
            style={{ 
              height: 'auto', 
              minHeight: '80px',
              maxHeight: `${maxHeight}px`
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, maxHeight) + 'px';
            }}
          />
          {showSpeechToText && (
            <SpeechToText
              onResult={handleSpeechResult}
              className="shrink-0"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WritingCard;