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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/40">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                {/* F letter */}
                <path
                  d="M6 6H15V9H9V14H14V17H9V26H6V6Z"
                  fill="white"
                />
                {/* M letter */}
                <path
                  d="M17 6H20L23 14L26 6H29V26H26V12L23 20H23L20 12V26H17V6Z"
                  fill="white"
                />
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-slate-500">
          <span>
            FrameMatch by{' '}
            <a href="https://www.e-studios.net" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              e-studios
            </a>
          </span>
          <span className="hidden sm:inline">|</span>
          <a
            href="https://paypal.me/elvisbrahm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            Support with a donation
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
