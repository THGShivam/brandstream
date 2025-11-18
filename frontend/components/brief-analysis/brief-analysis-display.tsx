"use client"

import {
  Building2,
  Target,
  Users,
  MessageSquare,
  Palette,
  Radio,
  Zap,
  Trophy,
  TrendingUp
} from "lucide-react"
import { useState, useEffect } from "react"
import { BriefAnalysisResponse } from "@/services/api"
import { SectionCard } from "./section-card"
import { FieldDisplay } from "./field-display"

interface BriefAnalysisDisplayProps {
  data: BriefAnalysisResponse
  onDataChange?: (updatedData: BriefAnalysisResponse) => void
}

export function BriefAnalysisDisplay({ data, onDataChange }: BriefAnalysisDisplayProps) {
  // Helper function to create a deep copy of the data structure
  const deepClone = <T,>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any

    const cloned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  // Initialize with a deep clone to ensure mutability
  const [editableData, setEditableData] = useState<BriefAnalysisResponse>(() => deepClone(data))

  // Update parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(editableData)
    }
  }, [editableData, onDataChange])

  // Helper function to update nested fields with proper deep cloning
  const updateField = (path: string[], value: string | string[]) => {
    setEditableData((prev) => {
      // Create a deep copy to avoid mutating read-only objects
      const newData = deepClone(prev)
      let current: any = newData

      // Navigate to the parent of the field to update
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }

      // Update the value
      const lastKey = path[path.length - 1]
      current[lastKey] = { ...current[lastKey], value }

      return newData
    })
  }
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Brief Analysis Complete</h2>
        <p className="text-foreground">
          Review the extracted and AI-generated insights from your creative brief.
          You can edit any field before proceeding.
        </p>
      </div>

      {/* Campaign Overview */}
      <SectionCard title="Campaign Overview" icon={Building2} iconColor="text-blue-400">
        <FieldDisplay
          label="Brand Name"
          field={editableData.brand_name}
          onChange={(value) => updateField(['brand_name'], value)}
        />
        <FieldDisplay
          label="Campaign Title"
          field={editableData.campaign_title}
          onChange={(value) => updateField(['campaign_title'], value)}
        />
        <FieldDisplay
          label="Brief Summary"
          field={editableData.brief_summary}
          description="A concise overview of your campaign"
          onChange={(value) => updateField(['brief_summary'], value)}
        />
      </SectionCard>

      {/* Project Objectives */}
      <SectionCard title="Project Objectives" icon={Target} iconColor="text-green-400">
        <FieldDisplay
          label="Business Objective"
          field={editableData.project_objectives.business_objective}
          description="Primary business goal for this campaign"
          onChange={(value) => updateField(['project_objectives', 'business_objective'], value)}
        />
        <FieldDisplay
          label="Marketing Objective"
          field={editableData.project_objectives.marketing_objective}
          description="Marketing-specific goals and targets"
          onChange={(value) => updateField(['project_objectives', 'marketing_objective'], value)}
        />
        <FieldDisplay
          label="Communication Objective"
          field={editableData.project_objectives.communication_objective}
          description="Message and communication goals"
          onChange={(value) => updateField(['project_objectives', 'communication_objective'], value)}
        />

        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <FieldDisplay
            label="Key Metrics"
            field={editableData.project_objectives.key_metrics}
            description="Primary success metrics"
            onChange={(value) => updateField(['project_objectives', 'key_metrics'], value)}
          />
          <FieldDisplay
            label="Key Indicators"
            field={editableData.project_objectives.key_indicators}
            description="Performance indicators to track"
            onChange={(value) => updateField(['project_objectives', 'key_indicators'], value)}
          />
        </div>
      </SectionCard>

      {/* Target Audience */}
      <SectionCard title="Target Audience" icon={Users} iconColor="text-orange-400">
        <div className="grid md:grid-cols-2 gap-4">
          <FieldDisplay
            label="Demographics"
            field={editableData.target_audience.demographics}
            description="Age, location, and demographic details"
            onChange={(value) => updateField(['target_audience', 'demographics'], value)}
          />
          <FieldDisplay
            label="Psychographics"
            field={editableData.target_audience.psychographics}
            description="Lifestyle, values, and interests"
            onChange={(value) => updateField(['target_audience', 'psychographics'], value)}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldDisplay
            label="Needs & Problems"
            field={editableData.target_audience.needs_problems}
            description="What problems does your product solve?"
            onChange={(value) => updateField(['target_audience', 'needs_problems'], value)}
          />
          <FieldDisplay
            label="Decision Behavior"
            field={editableData.target_audience.decision_behaviour}
            description="How your audience makes purchase decisions"
            onChange={(value) => updateField(['target_audience', 'decision_behaviour'], value)}
          />
        </div>
      </SectionCard>

      {/* Creative Direction */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Key Message" icon={MessageSquare} iconColor="text-pink-400">
          <FieldDisplay
            label="Campaign Message"
            field={editableData.key_message}
            description="Your core campaign message"
            onChange={(value) => updateField(['key_message'], value)}
          />
        </SectionCard>

        <SectionCard title="Visual Style" icon={Palette} iconColor="text-purple-400">
          <FieldDisplay
            label="Visual Direction"
            field={editableData.visual_style}
            description="Aesthetic and visual guidelines"
            onChange={(value) => updateField(['visual_style'], value)}
          />
        </SectionCard>
      </div>

      {/* Distribution & USP */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Distribution Channels" icon={Radio} iconColor="text-cyan-400">
          <FieldDisplay
            label="Channels"
            field={editableData.channels}
            description="Where your campaign will run"
            onChange={(value) => updateField(['channels'], value)}
          />
        </SectionCard>

        <SectionCard title="Unique Selling Proposition" icon={Zap} iconColor="text-yellow-400">
          <FieldDisplay
            label="USP"
            field={editableData.usp}
            description="What makes your offering unique"
            onChange={(value) => updateField(['usp'], value)}
          />
        </SectionCard>
      </div>

      {/* Legend */}
      <div className="bg-card/50 border border-border rounded-xl p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/50 rounded"></div>
            <span className="text-muted-foreground">Extracted from brief</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500/20 border border-purple-500/50 rounded"></div>
            <span className="text-muted-foreground">AI-generated insights</span>
          </div>
        </div>
      </div>
    </div>
  )
}
