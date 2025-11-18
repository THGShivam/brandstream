"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface Step {
  title: string
  description: string
}

interface StepperFlowProps {
  currentStep: number
  steps: Step[]
  onStepClick: (step: number) => void
}

export function StepperFlow({ currentStep, steps, onStepClick }: StepperFlowProps) {
  return (
    <div className="bg-card dark:bg-card/50 border border-border rounded-xl p-8">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <button
              onClick={() => index <= currentStep && onStepClick(index)}
              className={`shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                index < currentStep
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                  : index === currentStep
                    ? "bg-purple-500/20 border-purple-500 text-purple-400 scale-110"
                    : "bg-muted/50 border-border text-muted-foreground"
              }`}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </button>

            {/* Step Info */}
            <div className="ml-4 shrink-0" style={{ width: '180px' }}>
              <p
                className={`font-semibold text-sm transition-colors ${
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 rounded transition-colors mx-4 ${
                  index < currentStep ? "bg-emerald-500/40" : "bg-border"
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
