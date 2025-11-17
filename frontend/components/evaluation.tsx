"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function Evaluation() {
  const [showScores, setShowScores] = useState(false)

  const scores = [
    { label: "Brand Alignment", score: 92, color: "bg-purple-500" },
    { label: "Audience Resonance", score: 88, color: "bg-blue-500" },
    { label: "Visual Impact", score: 94, color: "bg-pink-500" },
    { label: "Copy Effectiveness", score: 85, color: "bg-amber-500" },
  ]

  return (
    <div className="space-y-6 pt-8 border-t border-border">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Evaluation & Optimization</h2>
        <p className="text-muted-foreground">Review AI-generated performance metrics and refine your creative</p>
      </div>

      {/* Asset Preview */}
      <Card className="bg-card border border-border p-8 text-center">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-12 border border-purple-500/20">
          <div className="text-6xl mb-4">🖼️</div>
          <p className="text-lg text-muted-foreground">Generated Asset Preview</p>
          <p className="text-sm text-muted-foreground mt-2">Your creative asset will appear here</p>
        </div>
      </Card>

      {/* Score Cards */}
      {showScores && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scores.map((item) => (
            <Card key={item.label} className="bg-card border border-border p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-border"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(item.score / 100) * 226} 226`}
                    className={item.color}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{item.score}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowScores(!showScores)}
          className="flex-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 py-6"
        >
          {showScores ? "✓ View Scores" : "📊 View Scores"}
        </Button>
        <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 py-6">
          🔄 Regenerate With Feedback
        </Button>
      </div>
    </div>
  )
}
