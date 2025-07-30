import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface MessageDialogProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: () => void;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  messages,
  isOpen,
  onClose,
  onMarkAsRead
}) => {
  const handleConfirmRead = () => {
    onMarkAsRead();
    onClose();
  };

  if (messages.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Messaggio dal Superuser
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 mb-2">
                Ricevuto: {new Date(message.timestamp).toLocaleString()}
              </div>
              <div className="text-slate-800 font-medium">
                {message.content}
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-4">
            <Button onClick={handleConfirmRead} className="w-full">
              Conferma Lettura
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;