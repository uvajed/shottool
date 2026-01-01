function ColorPanel({ data, expanded = false }) {
  const color = data || {
    temperature: 'Warm',
    contrast: 'Medium-High',
    saturation: 'Slightly Desaturated',
    shadows: 'Lifted, Teal tint',
    highlights: 'Warm, Orange push',
    palette: ['#1a2634', '#3d4f5f', '#d4a574', '#f5e6d3', '#8b5a2b'],
  }

  const items = [
    { label: 'Temperature', value: color.temperature },
    { label: 'Contrast', value: color.contrast },
    { label: 'Saturation', value: color.saturation },
    { label: 'Shadows', value: color.shadows },
    { label: 'Highlights', value: color.highlights },
  ]

  // Generate SVG path from tone curve points
  // Points are [x, y] where x and y are 0-100, y needs to be flipped for SVG coordinates
  const generateCurvePath = (points) => {
    if (!points || points.length < 2) {
      // Fallback to linear curve
      return "M 0 100 L 100 0"
    }

    // Convert points to SVG coordinates (flip Y axis)
    const svgPoints = points.map(([x, y]) => [x, 100 - y])

    // Create a smooth curve through the points using quadratic bezier
    let path = `M ${svgPoints[0][0]} ${svgPoints[0][1]}`

    for (let i = 1; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1]
      const curr = svgPoints[i]

      // Use quadratic bezier for smooth curve
      const cpX = (prev[0] + curr[0]) / 2
      const cpY = prev[1]

      if (i === 1) {
        path += ` Q ${cpX} ${cpY}, ${curr[0]} ${curr[1]}`
      } else {
        path += ` T ${curr[0]} ${curr[1]}`
      }
    }

    return path
  }

  const curvePath = generateCurvePath(color.toneCurve)
  const fillPath = curvePath + " L 100 100 L 0 100 Z"

  return (
    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Color Grade</h3>
        </div>
        <button className="px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/10 transition-colors">
          Download LUT
        </button>
      </div>

      {!expanded && (
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-4">
          {color.palette?.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      )}

      <div className={`grid ${expanded ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        {items.map((item, index) => (
          <div key={index} className="py-2">
            <span className="text-xs text-slate-500 block mb-1">{item.label}</span>
            <span className="text-sm font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-400 mb-4">Tone Curve</h4>
          <div className="h-40 bg-slate-900 rounded-lg relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Reference diagonal line (linear response) */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
              {/* Actual tone curve from image analysis */}
              <path
                d={curvePath}
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="2"
              />
              <path
                d={fillPath}
                fill="url(#curveGradient)"
              />
              {/* Control points visualization */}
              {color.toneCurve?.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={100 - y}
                  r="1.5"
                  fill="#f59e0b"
                  opacity="0.6"
                />
              ))}
            </svg>
            <div className="absolute bottom-2 left-2 text-xs text-slate-500">Shadows</div>
            <div className="absolute top-2 right-2 text-xs text-slate-500">Highlights</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPanel
