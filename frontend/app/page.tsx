"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { StepperFlow } from "@/components/stepper-flow"
import { BriefUpload } from "@/components/steps/brief-upload"
import { TemplateMapping } from "@/components/steps/template-mapping"
import { GenerateAssets } from "@/components/steps/generate-assets"
import { ReviewExport } from "@/components/steps/review-export"

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { title: "Insight and Strategy", description: "Upload your creative brief" },
    { title: "Brief Analysis", description: "Review analyzed brief data" },
    { title: "Creative Generation", description: "AI-powered asset generation" },
    { title: "Optimization & Export", description: "Review and export your work" },
  ]

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGoToStep = (step: number) => {
    setCurrentStep(step)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stepper */}
        <StepperFlow currentStep={currentStep} steps={steps} onStepClick={handleGoToStep} />

        {/* Step Content */}
        <div className="mt-12">
          {currentStep === 0 && (
            <BriefUpload onNext={handleNextStep} />
          )}
          {currentStep === 1 && (
            <TemplateMapping
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}
          {currentStep === 2 && <GenerateAssets onNext={handleNextStep} onPrev={handlePrevStep} />}
          {currentStep === 3 && <ReviewExport onPrev={handlePrevStep} />}
        </div>
      </main>
    </div>
  )
}
