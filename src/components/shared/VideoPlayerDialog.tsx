import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoSrc: string;
  title?: string;
}

const VideoPlayerDialog: React.FC<VideoPlayerDialogProps> = ({
  open,
  onOpenChange,
  videoSrc,
  title = "Filmato demo"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4">
          <video
            src={videoSrc}
            controls
            autoPlay
            playsInline
            webkit-playsinline="true"
            className="w-full max-h-[70vh] min-h-[200px] rounded-lg bg-black object-contain"
          >
            Il tuo browser non supporta la riproduzione video.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerDialog;
