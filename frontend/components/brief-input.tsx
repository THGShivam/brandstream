"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function BriefInput() {
  const [brief, setBrief] = useState("")
  const [mappedTemplate, setMappedTemplate] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Let's Build Your Next Winning Campaign</h2>
        <p className="text-muted-foreground">
          Upload your brief and let our Intelligence Engine transform it into actionable strategy
        </p>
      </div>

      {/* Upload Area */}
      <Card className="bg-card/50 border-dashed border-2 border-purple-500/30 p-12 text-center cursor-pointer hover:border-purple-500/50 hover:bg-card/80 transition-all">
        <div className="space-y-4">
          <div className="text-5xl">📤</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Upload Your Creative Brief</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start here. Upload your main brief document (.pdf, .docx, .pptx). Max 50MB.
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-foreground hover:from-purple-600 hover:to-pink-600">
              📎 Upload Your Creative Brief
            </Button>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>📄 PDF</span>
            <span>📄 DOCX</span>
            <span>📊 PPTX</span>
            <span>Max 50MB</span>
          </div>
        </div>
      </Card>

      {/* Quick Paste Option */}
      <div className="space-y-3">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Or paste your brief content here..."
          className="w-full h-32 px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 resize-none"
        />
        <Button
          onClick={() => setMappedTemplate(true)}
          disabled={!brief}
          className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
        >
          Map to Template
        </Button>
      </div>

      {/* Template Mapping */}
      {mappedTemplate && (
        <Card className="bg-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Template Mapping Results</h3>
          <div className="space-y-3">
            {[
              { label: "Primary Goal", value: "Drive trial for fitness gaming...", editable: true },
              { label: "Target Audience", value: "UK males aged 18-25 with interest in fitness...", editable: true },
              { label: "Key Metrics for Success", value: "Website Clicks - 50k+ requests...", editable: true },
              { label: "Mandatory Inclusions", value: 'Energize logo and tagline "Power Up"', editable: true },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <input
                  type="text"
                  defaultValue={field.value}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-purple-500/50"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
