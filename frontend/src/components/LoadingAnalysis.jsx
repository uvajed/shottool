import { useState, useEffect } from 'react'

const analysisSteps = [
  { text: 'Reading image metadata...', icon: '📷' },
  { text: 'Analyzing depth of field...', icon: '🔍' },
  { text: 'Detecting light sources...', icon: '💡' },
  { text: 'Extracting color palette...', icon: '🎨' },
  { text: 'Analyzing tone curve...', icon: '📊' },
  { text: 'Generating recommendations...', icon: '✨' },
]

function LoadingAnalysis({ imagePreview }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    // Progress through steps without looping
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        // Stop at the last step instead of looping
        if (prev >= analysisSteps.length - 1) {
          return prev
        }
        return prev + 1
      })
    }, 800)

    // Track elapsed time for the progress bar
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 100)
    }, 100)

    return () => {
      clearInterval(stepInterval)
      clearInterval(timeInterval)
    }
  }, [])

  // Estimate progress (assume ~5 seconds typical analysis time)
  const estimatedDuration = 5000
  const progress = Math.min((elapsedTime / estimatedDuration) * 100, 95)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="relative">
          <img
            src={imagePreview}
            alt="Uploaded"
            className="w-full rounded-xl shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 text-white mb-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              <span className="text-sm font-medium">Processing image...</span>
              <span className="ml-auto text-xs text-slate-300">{Math.round(progress)}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-6">
            Analyzing Your Shot
          </h3>

          {analysisSteps.map((step, index) => {
            const isActive = index === currentStep
            const isComplete = index < currentStep
            const isLast = index === analysisSteps.length - 1
            const isWaiting = isActive && isLast && progress > 80

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-500/50'
                    : isComplete
                    ? 'bg-slate-800/50'
                    : 'bg-slate-800/30 opacity-30'
                }`}
              >
                <span className="text-xl">{step.icon}</span>
                <span className={`text-sm ${isActive ? 'text-white' : isComplete ? 'text-slate-300' : 'text-slate-400'}`}>
                  {isWaiting ? 'Finishing up...' : step.text}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                  </div>
                )}
                {isComplete && (
                  <svg className="ml-auto w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LoadingAnalysis
