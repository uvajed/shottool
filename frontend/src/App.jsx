import { useState } from 'react'
import ImageUploader from './components/ImageUploader'
import AnalysisResults from './components/AnalysisResults'
import LoadingAnalysis from './components/LoadingAnalysis'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  const handleImageUpload = async (file) => {
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
    setIsAnalyzing(true)
    setAnalysisResult(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setImagePreview(null)
    setAnalysisResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                {/* Eye outline */}
                <path
                  d="M2 16C2 16 7 6 16 6C25 6 30 16 30 16C30 16 25 26 16 26C7 26 2 16 2 16Z"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="rgba(255,255,255,0.1)"
                  strokeLinejoin="round"
                />
                {/* Iris outer ring */}
                <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.15)" />
                {/* Iris inner detail */}
                <circle cx="16" cy="16" r="3.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1" fill="none" />
                {/* Pupil */}
                <circle cx="16" cy="16" r="2" fill="white" />
                {/* Highlight reflection */}
                <circle cx="18" cy="14" r="1" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FrameMatch</h1>
              <p className="text-xs text-slate-400">Analyze & Recreate Any Shot</p>
            </div>
          </div>
          {(image || analysisResult) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!image && !analysisResult && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Decode Any Shot
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Upload a reference image from a film, photograph, or screenshot.
              Get instant technical analysis of camera settings, lighting, and color grade.
            </p>
          </div>
        )}

        {!image && <ImageUploader onUpload={handleImageUpload} />}

        {isAnalyzing && <LoadingAnalysis imagePreview={imagePreview} />}

        {error && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {analysisResult && (
          <AnalysisResults
            result={analysisResult}
            imagePreview={imagePreview}
          />
        )}
      </main>

      <footer className="border-t border-slate-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          FrameMatch by e-studios | Powered by AI
        </div>
      </footer>
    </div>
  )
}

export default App
