"use client"

import { Sparkles, FileText, X, Plus, Edit2, Check } from "lucide-react"
import { useState } from "react"

interface FieldValue {
  value: string | string[]
  source: "extracted" | "generated"
}

interface FieldDisplayProps {
  label: string
  field: FieldValue
  description?: string
  onChange?: (value: string | string[]) => void
}

export function FieldDisplay({ label, field, description, onChange }: FieldDisplayProps) {
  const isGenerated = field.source === "generated"
  const isArray = Array.isArray(field.value)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | string[]>(field.value)
  const [newArrayItem, setNewArrayItem] = useState("")

  const handleSave = () => {
    if (onChange) {
      onChange(editValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(field.value)
    setNewArrayItem("")
    setIsEditing(false)
  }

  const handleArrayItemRemove = (index: number) => {
    if (Array.isArray(editValue)) {
      const newValue = editValue.filter((_, i) => i !== index)
      setEditValue(newValue)
    }
  }

  const handleArrayItemAdd = () => {
    if (newArrayItem.trim() && Array.isArray(editValue)) {
      setEditValue([...editValue, newArrayItem.trim()])
      setNewArrayItem("")
    }
  }

  const handleArrayItemEdit = (index: number, value: string) => {
    if (Array.isArray(editValue)) {
      const newValue = [...editValue]
      newValue[index] = value
      setEditValue(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">{label}</label>
        <div className="flex items-center gap-2">
          <SourceBadge source={field.source} />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Edit field"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                className="p-1.5 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                title="Save changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Cancel editing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}

      {/* Display Mode */}
      {!isEditing && (
        <>
          {isArray ? (
            <div className="flex flex-wrap gap-2">
              {(field.value as string[]).map((item, index) => (
                <span
                  key={index}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isGenerated
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div
              className={`p-3 rounded-lg text-sm ${
                isGenerated
                  ? 'bg-purple-500/10 text-purple-100 border border-purple-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {field.value as string}
            </div>
          )}
        </>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <>
          {isArray ? (
            <div className="space-y-2">
              {/* Existing items */}
              <div className="space-y-2">
                {Array.isArray(editValue) && editValue.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayItemEdit(index, e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 ${
                        isGenerated
                          ? 'bg-purple-500/10 text-purple-100 border-purple-500/30 focus:ring-purple-500/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700 focus:ring-slate-500'
                      }`}
                    />
                    <button
                      onClick={() => handleArrayItemRemove(index)}
                      className="p-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newArrayItem}
                  onChange={(e) => setNewArrayItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleArrayItemAdd()
                    }
                  }}
                  placeholder="Add new item..."
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 ${
                    isGenerated
                      ? 'bg-purple-500/10 text-purple-100 border-purple-500/30 placeholder-purple-400/50 focus:ring-purple-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700 placeholder-slate-500 focus:ring-slate-500'
                  }`}
                />
                <button
                  onClick={handleArrayItemAdd}
                  disabled={!newArrayItem.trim()}
                  className="p-2 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Add item"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <textarea
              value={editValue as string}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 resize-none ${
                isGenerated
                  ? 'bg-purple-500/10 text-purple-100 border-purple-500/30 focus:ring-purple-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 focus:ring-slate-500'
              }`}
            />
          )}
        </>
      )}
    </div>
  )
}

interface SourceBadgeProps {
  source: "extracted" | "generated"
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const isGenerated = source === "generated"

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
        isGenerated
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-blue-500/20 text-blue-300'
      }`}
    >
      {isGenerated ? (
        <>
          <Sparkles className="w-3 h-3" />
          AI Generated
        </>
      ) : (
        <>
          <FileText className="w-3 h-3" />
          Extracted
        </>
      )}
    </span>
  )
}
