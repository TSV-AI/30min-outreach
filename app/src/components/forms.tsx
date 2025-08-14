"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [busy, setBusy] = useState(false);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setBusy(true);
    
    try {
      const text = await file.text();
      let records: any[] = [];
      
      // Parse JSONL or JSON
      if (text.trim().startsWith("[")) {
        records = JSON.parse(text);
      } else {
        records = text.split(/\n+/).filter(Boolean).map(line => JSON.parse(line));
      }
      
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records })
      });
      
      const result = await response.json();
      
      if (result.count > 0) {
        alert(`✅ Successfully imported ${result.count} leads${result.filtered > 0 ? ` (${result.filtered} filtered out)` : ''}`);
        setTimeout(() => location.reload(), 1000);
      } else {
        alert(`No leads imported. ${result.filtered || 0} emails were filtered out.`);
      }
      
    } catch (error) {
      alert("Error processing file. Make sure it's valid JSON or JSONL format.");
    } finally {
      setBusy(false);
    }
  };
  
  return (
    <>
      <input
        type="file"
        accept=".jsonl,.json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="import-file-input"
        disabled={busy}
      />
      <Button 
        variant="outline" 
        disabled={busy}
        onClick={() => document.getElementById('import-file-input')?.click()}
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {busy ? "Importing..." : "Import File"}
      </Button>
    </>
  );
}