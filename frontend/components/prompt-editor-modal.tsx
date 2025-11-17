"use client"

import { useState, useEffect } from "react"
import { Image as ImageIcon, FileText, Video, Save, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type PromptType = 'image' | 'copy' | 'video'

interface PromptEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promptType: PromptType
  promptValue: string
  onSave: (value: string) => void
}

const promptConfig = {
  image: {
    title: "Image Generation Prompt",
    description: "Edit the prompt that will be used to generate images for your campaign",
    icon: ImageIcon,
    iconColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10"
  },
  copy: {
    title: "Copy/Script Generation Prompt",
    description: "Edit the prompt that will be used to generate copy and scripts for your campaign",
    icon: FileText,
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10"
  },
  video: {
    title: "Video Generation Prompt",
    description: "Edit the prompt that will be used to generate videos for your campaign",
    icon: Video,
    iconColor: "text-green-400",
    bgColor: "bg-green-500/10"
  }
}

export function PromptEditorModal({
  open,
  onOpenChange,
  promptType,
  promptValue,
  onSave
}: PromptEditorModalProps) {
  const [editedValue, setEditedValue] = useState(promptValue)
  const [hasChanges, setHasChanges] = useState(false)

  const config = promptConfig[promptType]
  const IconComponent = config.icon

  // Update edited value when prompt value changes
  useEffect(() => {
    setEditedValue(promptValue)
    setHasChanges(false)
  }, [promptValue, open])

  const handleValueChange = (value: string) => {
    setEditedValue(value)
    setHasChanges(value !== promptValue)
  }

  const handleSave = () => {
    onSave(editedValue)
    setHasChanges(false)
    onOpenChange(false)
  }

  const handleReset = () => {
    setEditedValue(promptValue)
    setHasChanges(false)
  }

  const handleCancel = () => {
    setEditedValue(promptValue)
    setHasChanges(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Prompt Content</label>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-xs text-amber-400">• Unsaved changes</span>
                )}
                <span className="text-xs text-slate-500">
                  {editedValue.length} characters
                </span>
              </div>
            </div>
            <Textarea
              value={editedValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={`Enter your ${promptType} generation prompt...`}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="bg-transparent border-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-transparent border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
