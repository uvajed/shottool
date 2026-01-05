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
  const [showDonationPrompt, setShowDonationPrompt] = useState(false)

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

      const count = parseInt(localStorage.getItem('analysisCount') || '0') + 1
      localStorage.setItem('analysisCount', count.toString())

      const lastPrompt = parseInt(localStorage.getItem('lastDonationPrompt') || '0')
      if (count >= 5 && count - lastPrompt >= 5) {
        setTimeout(() => setShowDonationPrompt(true), 1500)
        localStorage.setItem('lastDonationPrompt', count.toString())
      }
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Film grain overlay */}
      <div className="film-grain film-grain-animated" />

      {/* Header */}
      <header className="relative z-10 border-b" style={{ borderColor: 'var(--border-dim)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={handleReset} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative">
                {/* Lens/aperture icon */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                       boxShadow: '0 0 20px var(--accent-glow)'
                     }}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--bg-primary)' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  FRAMEMATCH
                </h1>
                <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  Shot Analysis System
                </p>
              </div>
            </button>

            {/* Status indicator & actions */}
            <div className="flex items-center gap-6">
              {/* Recording indicator */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="indicator-dot rec-indicator" style={{ background: 'var(--tech-red)' }} />
                <span className="text-xs font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {isAnalyzing ? 'Processing' : 'Ready'}
                </span>
              </div>

              {(image || analysisResult) && (
                <button
                  onClick={handleReset}
                  className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-default)',
                    border: '1px solid var(--border-default)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-bright)'
                    e.currentTarget.style.borderColor = 'var(--border-bright)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-default)'
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Analysis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero section - only show when no image */}
          {!image && !analysisResult && (
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                   style={{ background: 'var(--surface-default)', border: '1px solid var(--border-dim)' }}>
                <span className="indicator-dot active" style={{ background: 'var(--tech-green)' }} />
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  AI-Powered Analysis
                </span>
              </div>

              <h2 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6"
                  style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
                DECODE ANY
                <span className="block" style={{ color: 'var(--accent-primary)' }}>CINEMATIC SHOT</span>
              </h2>

              <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Upload a reference frame from any film, photograph, or video.
                Get instant technical breakdowns of camera settings, lighting setups, and color grades.
              </p>
            </div>
          )}

          {/* Upload zone */}
          {!image && <ImageUploader onUpload={handleImageUpload} />}

          {/* Loading state */}
          {isAnalyzing && <LoadingAnalysis imagePreview={imagePreview} />}

          {/* Error state */}
          {error && (
            <div className="max-w-md mx-auto mt-8 p-6 rounded-lg animate-fade-in-up"
                 style={{
                   background: 'rgba(239, 68, 68, 0.1)',
                   border: '1px solid rgba(239, 68, 68, 0.3)'
                 }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" style={{ color: 'var(--tech-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: 'var(--tech-red)' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {analysisResult && (
            <AnalysisResults
              result={analysisResult}
              imagePreview={imagePreview}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t" style={{ borderColor: 'var(--border-dim)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Built by{' '}
                <a href="https://www.e-studios.net"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="transition-colors"
                   style={{ color: 'var(--text-secondary)' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                   onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  e-studios
                </a>
              </span>
              <span className="hidden sm:block w-px h-4" style={{ background: 'var(--border-default)' }} />
              <span className="hidden sm:block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                v1.0
              </span>
            </div>

            <a
              href="https://paypal.me/elvisbrahm"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                background: 'var(--surface-dim)',
                border: '1px solid var(--border-dim)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 166, 35, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(245, 166, 35, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-dim)'
                e.currentTarget.style.borderColor = 'var(--border-dim)'
              }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                Support Development
              </span>
            </a>
          </div>
        </div>
      </footer>

      {/* Donation Prompt Modal */}
      {showDonationPrompt && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
             style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-up"
               style={{
                 background: 'var(--bg-secondary)',
                 border: '1px solid var(--border-default)',
                 boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
               }}>
            {/* Modal header with accent strip */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-tertiary))' }} />

            <div className="p-8">
              <div className="text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                       boxShadow: '0 0 30px var(--accent-glow)'
                     }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--bg-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>

                <h3 className="font-display text-2xl tracking-wide mb-3" style={{ color: 'var(--text-primary)' }}>
                  ENJOYING FRAMEMATCH?
                </h3>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                  This tool is free and ad-free. If it's helping your creative work,
                  consider supporting its development with a small donation.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://paypal.me/elvisbrahm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-primary text-center"
                  >
                    Donate via PayPal
                  </a>
                  <button
                    onClick={() => setShowDonationPrompt(false)}
                    className="flex-1 btn-secondary"
                  >
                    Maybe Later
                  </button>
                </div>

                <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                  You won't see this again for a while
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
