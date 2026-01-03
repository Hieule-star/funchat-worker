import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionPickerProps {
  onReact: (reaction: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isSent: boolean;
}

const REACTIONS = [
  { emoji: "👍", label: "like" },
  { emoji: "❤️", label: "love" },
  { emoji: "😂", label: "laugh" },
  { emoji: "😮", label: "wow" },
  { emoji: "😢", label: "sad" },
  { emoji: "😡", label: "angry" },
];

export default function ReactionPicker({ 
  onReact, 
  isOpen, 
  onClose,
  isSent 
}: ReactionPickerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleReact = (reaction: string) => {
    onReact(reaction);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          
          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            className={cn(
              "absolute z-50 flex items-center gap-1 p-1.5 rounded-full bg-background shadow-lg border",
              isSent ? "right-0 bottom-full mb-2" : "left-0 bottom-full mb-2"
            )}
          >
            {REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: hoveredIndex === index ? 1.4 : 1,
                  y: hoveredIndex === index ? -8 : 0
                }}
                transition={{ 
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 400,
                  damping: 20
                }}
                onClick={() => handleReact(reaction.emoji)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                  "hover:bg-muted"
                )}
              >
                <span className="text-xl">{reaction.emoji}</span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
