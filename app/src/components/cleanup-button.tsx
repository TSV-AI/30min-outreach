'use client';

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CleanupPreview {
  invalid: number;
  doNotMail: number;
  total: number;
}

export function CleanupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);

  const getCleanupPreview = async () => {
    try {
      const response = await fetch('/api/leads/cleanup');
      const data = await response.json();
      
      if (data.ok) {
        setPreview(data.preview);
        
        if (data.preview.total === 0) {
          toast.info("No invalid or do-not-mail leads found to clean up");
        } else {
          const confirmMessage = `Found ${data.preview.total} leads to delete:\n` +
            `• ${data.preview.invalid} INVALID emails\n` +
            `• ${data.preview.doNotMail} DO_NOT_MAIL emails\n\n` +
            `This action cannot be undone. Continue?`;
            
          if (confirm(confirmMessage)) {
            await performCleanup();
          }
        }
      } else {
        toast.error("Failed to get cleanup preview");
      }
    } catch (error) {
      console.error('Error getting cleanup preview:', error);
      toast.error("Failed to get cleanup preview");
    }
  };

  const performCleanup = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/leads/cleanup', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast.success(`Successfully deleted ${data.deleted} invalid/do-not-mail leads`);
        
        if (data.companiesDeleted > 0) {
          toast.info(`Also cleaned up ${data.companiesDeleted} empty companies`);
        }
        
        // Refresh the page to update the leads table
        window.location.reload();
      } else {
        toast.error("Failed to delete invalid leads");
      }
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error("Failed to delete invalid leads");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={getCleanupPreview}
      disabled={isLoading}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isLoading ? "Cleaning..." : "Clean Invalid"}
    </Button>
  );
}