import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  onUploadComplete?: (url: string, path: string) => void;
  className?: string;
  variant?: 'default' | 'avatar';
  currentUrl?: string | null;
}

export function FileUpload({
  bucket,
  folder,
  accept = '*',
  maxSizeMB = 10,
  onUploadComplete,
  className,
  variant = 'default',
  currentUrl,
}: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const basePath = folder || user.id;
      const filePath = `${basePath}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadComplete?.(publicUrl, filePath);
      toast.success('File uploaded successfully');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (variant === 'avatar') {
    return (
      <div className={cn('relative group', className)}>
        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <Image className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 h-24 w-24 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Upload className="h-5 w-5 text-white" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload a file</p>
            <p className="text-xs text-muted-foreground">Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {preview && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{preview.split('/').pop()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setPreview(null);
              onUploadComplete?.('', '');
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
