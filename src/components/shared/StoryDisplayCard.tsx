import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StoryDisplayCardProps {
  title: string;
  content: string;
  maxHeight?: string;
  className?: string;
}

const StoryDisplayCard: React.FC<StoryDisplayCardProps> = ({
  title,
  content,
  maxHeight = "max-h-48",
  className = ""
}) => {
  if (!content) return null;

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`bg-slate-50 p-4 rounded-lg ${maxHeight} overflow-y-auto`}>
          <p className="text-slate-700 whitespace-pre-line">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryDisplayCard;