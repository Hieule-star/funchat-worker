import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { History } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface MessageEdit {
  id: string;
  original_content: string | null;
  edited_at: string;
}

interface MessageEditHistoryProps {
  messageId: string;
  isEdited: boolean;
}

export default function MessageEditHistory({ 
  messageId, 
  isEdited 
}: MessageEditHistoryProps) {
  const [editHistory, setEditHistory] = useState<MessageEdit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEditHistory = async () => {
    if (!isEdited) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_edits")
        .select("id, original_content, edited_at")
        .eq("message_id", messageId)
        .order("edited_at", { ascending: false });

      if (error) throw error;
      setEditHistory(data || []);
    } catch (error) {
      console.error("Error fetching edit history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEdited) return null;

  return (
    <Popover onOpenChange={(open) => open && fetchEditHistory()}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <History className="h-3 w-3" />
          <span className="italic">đã chỉnh sửa</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Lịch sử chỉnh sửa</h4>
        </div>
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : editHistory.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Không có lịch sử chỉnh sửa
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {editHistory.map((edit, index) => (
                <div 
                  key={edit.id} 
                  className="p-2 rounded-md bg-muted/50 text-sm"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(new Date(edit.edited_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                  </p>
                  <p className="text-foreground line-through opacity-70">
                    {edit.original_content || "(Không có nội dung)"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
