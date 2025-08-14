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
  return (
    <div className="space-y-2">
      <Textarea rows={6} placeholder='Paste JSONL or JSON array' value={jsonl} onChange={e=>setJsonl(e.target.value)} />
      <Button disabled={busy} onClick={async()=>{
        setBusy(true);
        let records:any[]=[];
        try {
          if (jsonl.trim().startsWith("[")) records = JSON.parse(jsonl);
          else records = jsonl.split(/\n+/).filter(Boolean).map(line=>JSON.parse(line));
        } catch(e) { alert("Invalid JSON/JSONL"); setBusy(false); return; }
        await fetch("/api/leads/import", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ records })});
        location.reload();
      }}>Import</Button>
    </div>
  );
}