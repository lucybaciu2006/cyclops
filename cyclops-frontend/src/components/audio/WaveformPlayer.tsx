import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { PlayIcon, PauseIcon } from "lucide-react"

export default function WaveformPlayer() {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!waveformRef.current) return
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#cbd5e1", // Tailwind slate-300
      progressColor: primary, // Tailwind purple-900
      cursorColor: primary, // Tailwind purple-900
      height: 62, // Reduced by 10% from 80
      url: "/demo-audio-edited.mp3", // Must be in public folder
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      barHeight: 1.5,
      normalize: true,
    })

    wavesurfer.current.on("finish", () => setIsPlaying(false))
    wavesurfer.current.on("ready", () => setIsLoading(false))

    return () => {
      wavesurfer.current?.destroy()
    }
  }, [])

  const togglePlay = () => {
    if (!wavesurfer.current) return
    wavesurfer.current.playPause()
    setIsPlaying(wavesurfer.current.isPlaying())
  }

  return (
    <div className="flex items-center gap-4 w-full h-[86px] max-w-[600px] mx-auto py-[12px] px-[38px] my-6 mx-24 bg-white shadow-[1px_1px_17px_#c6c6c6b3]">
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white transition-colors cursor-pointer"
      >
        {isPlaying ? (
          <PauseIcon className="w-6 h-6" />
        ) : (
          <PlayIcon className="w-6 h-6" />
        )}
      </button>
      <div className="flex-1 relative">
        <div ref={waveformRef} className={isLoading ? "opacity-0" : "opacity-100"} />
        {isLoading && (
          <div className="absolute inset-0 bg-white">
            <div className="absolute inset-0 flex items-center">
              <div className="h-8 w-full flex items-center justify-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-1 bg-slate-200 rounded animate-bounce"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
