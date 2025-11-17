"use client"

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
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 flex items-center">
            {/* Step Circle */}
            <button
              onClick={() => index <= currentStep && onStepClick(index)}
              className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                index < currentStep
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                  : index === currentStep
                    ? "bg-purple-500/20 border-purple-500 text-purple-400 scale-110"
                    : "bg-slate-800/50 border-slate-700 text-slate-500"
              }`}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </button>

            {/* Step Info */}
            <div className="ml-4">
              <p
                className={`font-semibold text-sm transition-colors ${
                  index <= currentStep ? "text-white" : "text-slate-500"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`ml-8 flex-1 h-1 rounded transition-colors ${
                  index < currentStep ? "bg-emerald-500/40" : "bg-slate-800"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
