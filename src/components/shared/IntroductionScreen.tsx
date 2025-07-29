import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StoryLayout from '@/components/shared/StoryLayout';

interface IntroductionScreenProps {
  title: string;
  subtitle?: string;
  description: string | React.ReactNode;
  onContinue: () => void;
  onExit: () => void;
  continueButtonText?: string;
  exitButtonText?: string;
  backgroundColor?: string;
  showHomeButton?: boolean;
  icon?: React.ReactNode;
  features?: string[];
}

const IntroductionScreen: React.FC<IntroductionScreenProps> = ({
  title,
  subtitle,
  description,
  onContinue,
  onExit,
  continueButtonText = "Inizia",
  exitButtonText = "Torna indietro",
  backgroundColor = "bg-gradient-to-br from-slate-50 to-slate-100",
  showHomeButton = false,
  icon,
  features = []
}) => {
  return (
    <div className={`min-h-screen ${backgroundColor} p-4`}>
      {showHomeButton && <div className="pt-12" />}
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            {icon && (
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-slate-800">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-lg text-slate-600 mt-2">
                {subtitle}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {typeof description === 'string' ? (
                <p className="text-slate-700 leading-relaxed">
                  {description}
                </p>
              ) : (
                description
              )}
            </div>
            
            {features.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-2">Come funziona:</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={onExit}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                {exitButtonText}
              </Button>
              <Button 
                onClick={onContinue}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {continueButtonText}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntroductionScreen;