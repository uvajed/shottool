function CameraPanel({ data }) {
  const camera = data || {
    focalLength: '~85mm',
    aperture: 'f/2.0 - f/2.8',
    iso: 'Low (100-400)',
    shutterSpeed: '1/125s',
    sensorSize: 'Full Frame',
  }

  const items = [
    { label: 'Focal Length', value: camera.focalLength, icon: '🔭' },
    { label: 'Aperture', value: camera.aperture, icon: '⚙️' },
    { label: 'ISO', value: camera.iso, icon: '📊' },
    { label: 'Shutter Speed', value: camera.shutterSpeed, icon: '⏱️' },
    { label: 'Sensor Size', value: camera.sensorSize, icon: '📷' },
  ]

  // Add camera/lens info if available from EXIF
  if (camera.camera) {
    items.unshift({ label: 'Camera', value: camera.camera, icon: '📷' })
  }
  if (camera.lens) {
    items.splice(camera.camera ? 1 : 0, 0, { label: 'Lens', value: camera.lens, icon: '🔍' })
  }

  return (
    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Camera Settings</h3>
        {camera.hasExif ? (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            EXIF Data
          </span>
        ) : (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Estimated
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <span>{item.icon}</span>
              {item.label}
            </span>
            <span className="text-sm font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CameraPanel
