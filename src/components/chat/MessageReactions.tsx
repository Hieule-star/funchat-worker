import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Reaction {
  reaction: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  isSent: boolean;
}

export default function MessageReactions({ 
  reactions, 
  onToggleReaction,
  isSent 
}: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-1 mt-1",
      isSent ? "justify-end" : "justify-start"
    )}>
      <AnimatePresence mode="popLayout">
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.reaction}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            onClick={() => onToggleReaction(reaction.reaction)}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
              "bg-background border shadow-sm transition-colors",
              reaction.hasReacted 
                ? "border-primary/50 bg-primary/10" 
                : "hover:bg-muted"
            )}
          >
            <motion.span
              key={`${reaction.reaction}-${reaction.count}`}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {reaction.reaction}
            </motion.span>
            {reaction.count > 1 && (
              <span className="text-muted-foreground font-medium">
                {reaction.count}
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
