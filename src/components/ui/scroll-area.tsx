import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }

interface StoryListProps {
  stories: Array<{
    id: string;
    title: string;
    lastModified: string;
    authorName?: string;
  }>;
  onStorySelect: (storyId: string) => void;
  showAuthor?: boolean;
}

export const StoryScrollViewer: React.FC<StoryListProps> = ({ 
  stories, 
  onStorySelect, 
  showAuthor = false 
}) => {
  return (
    <ScrollArea className="h-64 w-full border rounded-md">
      <div className="p-4">
        {stories.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            Nessuna storia trovata
          </div>
        ) : (
          <div className="space-y-2">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => onStorySelect(story.id)}
                className="flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">
                    {story.title}
                  </div>
                  {showAuthor && story.authorName && (
                    <div className="text-sm text-slate-500 truncate">
                      {story.authorName}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500 ml-4">
                  {story.lastModified}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};