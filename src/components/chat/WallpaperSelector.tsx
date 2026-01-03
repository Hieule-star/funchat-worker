import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WALLPAPER_PRESETS, WallpaperPreset } from '@/lib/wallpaper-presets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface WallpaperSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWallpaper: { type: string; value: string | null };
  onSelect: (type: 'gradient' | 'image' | 'none', value: string | null) => void;
}

export default function WallpaperSelector({
  open,
  onOpenChange,
  currentWallpaper,
  onSelect
}: WallpaperSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<WallpaperPreset | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetClick = (preset: WallpaperPreset) => {
    setSelectedPreset(preset);
    setCustomImageUrl(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh (JPG, PNG, WebP...)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(fileName);

      setCustomImageUrl(publicUrl);
      setSelectedPreset(null);

      toast({
        title: "Đã tải lên",
        description: "Ảnh đã được tải lên thành công"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Không thể tải ảnh lên. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApply = () => {
    if (customImageUrl) {
      onSelect('image', customImageUrl);
      onOpenChange(false);
      setCustomImageUrl(null);
      setSelectedPreset(null);
    } else if (selectedPreset) {
      onSelect(selectedPreset.type as 'gradient' | 'none', selectedPreset.value);
      onOpenChange(false);
      setSelectedPreset(null);
    }
  };

  const isSelected = (preset: WallpaperPreset) => {
    if (customImageUrl) return false;
    if (selectedPreset) {
      return selectedPreset.id === preset.id;
    }
    if (preset.type === 'none' && currentWallpaper.type === 'none') {
      return true;
    }
    return currentWallpaper.value === preset.value;
  };

  const getPreviewStyle = (preset: WallpaperPreset): React.CSSProperties => {
    if (preset.type === 'none' || !preset.value) {
      return { backgroundColor: 'hsl(var(--muted))' };
    }
    if (preset.value.startsWith('linear-gradient')) {
      return { background: preset.value };
    }
    return { backgroundColor: preset.value };
  };

  const canApply = selectedPreset || customImageUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-lg font-semibold">
            Chọn hình nền
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="grid grid-cols-4 gap-3 px-2">
            {/* Upload custom image button */}
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                "border-2 border-dashed border-muted-foreground/30",
                "hover:border-primary hover:bg-muted/50",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-muted-foreground text-center px-1">
                      Tải ảnh
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Custom image preview if uploaded */}
            {customImageUrl && (
              <button
                onClick={() => setSelectedPreset(null)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary",
                  "ring-2 ring-primary ring-offset-2"
                )}
              >
                <img 
                  src={customImageUrl} 
                  alt="Custom wallpaper" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </button>
            )}

            {/* Preset wallpapers */}
            {WALLPAPER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary",
                  isSelected(preset) && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Background preview */}
                <div 
                  className="absolute inset-0"
                  style={getPreviewStyle(preset)}
                />
                
                {/* Overlay pattern for non-none presets */}
                {preset.type !== 'none' && preset.id !== 'default' && (
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                )}

                {/* Emoji and name */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl mb-1">
                    {preset.type === 'none' ? (
                      <X className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      preset.emoji
                    )}
                  </span>
                  <span className={cn(
                    "text-xs font-medium px-1 text-center line-clamp-1",
                    preset.type === 'none' ? "text-muted-foreground" : "text-white drop-shadow-md"
                  )}>
                    {preset.name}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected(preset) && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={handleApply}
            disabled={!canApply}
            className="w-full h-12 text-base font-medium"
          >
            Áp dụng hình nền
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </SheetContent>
    </Sheet>
  );
}
