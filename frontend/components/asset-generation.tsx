"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function AssetGeneration() {
  const [selectedModel, setSelectedModel] = useState("nano")
  const [selectedStrategy, setSelectedStrategy] = useState("conversion")
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="space-y-6 pt-8 border-t border-border">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Add Supporting Intelligence</h2>
        <p className="text-muted-foreground">Optional: Enhance AI analysis with additional context and data</p>
      </div>

      {/* Supporting Options */}
      <div className="grid gap-3">
        {[
          { icon: "👥", title: "Add Audience Data", desc: "Demographics, psychographics, behavior data" },
          { icon: "📊", title: "Add Market Research", desc: "Competitor analysis, market insights" },
          { icon: "🎨", title: "Add Brand Guidelines", desc: "Logo, colors, typography, tone of voice" },
          { icon: "🖼️", title: "Add Key Visuals/Assets", desc: "Product images, existing creative assets" },
        ].map((option) => (
          <Card
            key={option.title}
            className="bg-card border border-border p-4 cursor-pointer hover:border-purple-500/50 hover:bg-card/80 transition-all flex items-start gap-4"
          >
            <div className="text-2xl mt-1">{option.icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <span>+</span> {option.title}
              </p>
              <p className="text-sm text-muted-foreground">{option.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Asset Generation Section */}
      <div className="pt-8 border-t border-border space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Generate Creative Assets</h3>

          {/* Model Selection */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <label className="text-sm font-medium text-foreground block mb-4">Choose Generation Model</label>
            <div className="flex gap-4">
              {[
                { id: "nano", label: "Nano Banana", desc: "Fast image generation", icon: "⚡" },
                { id: "veo", label: "Veo3", desc: "Advanced video generation", icon: "🎬" },
              ].map((model) => (
                <label
                  key={model.id}
                  className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border hover:border-purple-500/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="hidden"
                  />
                  <div className="text-2xl mb-2">{model.icon}</div>
                  <p className="font-semibold text-foreground">{model.label}</p>
                  <p className="text-xs text-muted-foreground">{model.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <label className="text-sm font-medium text-foreground block mb-4">Select Strategy Type</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "conversion", label: "Conversion" },
                { id: "traffic", label: "Traffic" },
                { id: "retention", label: "Retention" },
              ].map((strategy) => (
                <label
                  key={strategy.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${
                    selectedStrategy === strategy.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border hover:border-purple-500/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={strategy.id}
                    checked={selectedStrategy === strategy.id}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="hidden"
                  />
                  <p className="font-semibold text-foreground">{strategy.label}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => setIsGenerating(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 py-6 text-lg font-semibold"
          >
            {isGenerating ? "✨ Generating Creative Asset..." : "✨ Generate Creative Asset"}
          </Button>
        </div>
      </div>
    </div>
  )
}
