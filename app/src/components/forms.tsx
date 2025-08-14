"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewCampaignForm() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Input placeholder="Campaign name" value={name} onChange={e=>setName(e.target.value)} />
      <Button disabled={busy} onClick={async()=>{
        setBusy(true);
        await fetch("/api/campaigns", { method: "POST", body: JSON.stringify({ name }), headers: { "Content-Type":"application/json" }});
        location.reload();
      }}>Create</Button>
    </div>
  );
}

export function ImportLeadsForm() {
  const [jsonl, setJsonl] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  
  return (
    <div className="space-y-2">
      <Textarea rows={6} placeholder='Paste JSONL or JSON array' value={jsonl} onChange={e=>setJsonl(e.target.value)} />
      
      <Button disabled={busy} onClick={async()=>{
        setBusy(true);
        setLastResult(null);
        let records:any[]=[];
        try {
          if (jsonl.trim().startsWith("[")) records = JSON.parse(jsonl);
          else records = jsonl.split(/\n+/).filter(Boolean).map(line=>JSON.parse(line));
        } catch(e) { 
          alert("Invalid JSON/JSONL"); 
          setBusy(false); 
          return; 
        }
        
        const response = await fetch("/api/leads/import", { 
          method: "POST", 
          headers: {"Content-Type":"application/json"}, 
          body: JSON.stringify({ records })
        });
        
        const result = await response.json();
        setLastResult(result);
        setBusy(false);
        
        // Only reload if successful imports
        if (result.count > 0) {
          setTimeout(() => location.reload(), 2000);
        }
      }}>
        {busy ? "Importing..." : "Import"}
      </Button>
      
      {lastResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm">
            <div className="font-medium text-green-600">
              ✅ {lastResult.count} leads imported successfully
            </div>
            {lastResult.filtered > 0 && (
              <div className="mt-2 text-orange-600">
                🚫 {lastResult.filtered} emails filtered out:
                <ul className="mt-1 ml-4 text-xs">
                  {lastResult.filteredDetails?.slice(0, 5).map((item: any, i: number) => (
                    <li key={i}>• {item.email} - {item.reason}</li>
                  ))}
                  {lastResult.filteredDetails?.length > 5 && (
                    <li>• ... and {lastResult.filteredDetails.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}