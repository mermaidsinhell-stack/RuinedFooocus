import { useState, useCallback, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { useSettings } from '@/hooks/useSettings'
import { useModels } from '@/hooks/useModels'
import { useGenerate } from '@/hooks/useGenerate'

import type { GenerateRequest, ControlNetPreset } from '@/api/types'

import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'

import { PromptInput } from '@/components/PromptInput'
import { GenerateButton } from '@/components/GenerateButton'
import { ImageOutput } from '@/components/ImageOutput'
import { Gallery } from '@/components/Gallery'
import { ModelSelector } from '@/components/ModelSelector'
import { LoraSelector } from '@/components/LoraSelector'
import { GenerationSettings } from '@/components/GenerationSettings'
import { ResolutionPicker } from '@/components/ResolutionPicker'
import { StyleSelector } from '@/components/StyleSelector'
import { SeedControl } from '@/components/SeedControl'
import { ControlNetPanel } from '@/components/ControlNetPanel'
import { ImageUpload } from '@/components/ImageUpload'
import { InpaintCanvas } from '@/components/InpaintCanvas'
import { OneButtonPrompt } from '@/components/OneButtonPrompt'
import { EvolvePanel } from '@/components/EvolvePanel'
import { LlamaRewrite } from '@/components/LlamaRewrite'
import { ImageBrowserView } from '@/components/ImageBrowserView'
import { ChatView } from '@/components/ChatView'
import { SettingsView } from '@/components/SettingsView'

// ---------------------------------------------------------------------------
// Default generation parameters
// ---------------------------------------------------------------------------

const DEFAULT_PARAMS: GenerateRequest = {
  prompt: '',
  negative_prompt: '',
  base_model_name: '',
  loras: [],
  style_selection: [],
  performance_selection: 'Speed',
  custom_steps: 30,
  cfg: 8,
  sampler_name: 'dpmpp_2m_sde_gpu',
  scheduler: 'karras',
  clip_skip: 1,
  aspect_ratios_selection: '1152x896 (4:3)',
  custom_width: 1152,
  custom_height: 896,
  seed: -1,
  image_number: 1,
  auto_negative_prompt: false,
  cn_selection: 'None',
  cn_type: 'Canny',
  input_image: null,
  cn_edge_low: 0.2,
  cn_edge_high: 0.8,
  cn_start: 0,
  cn_stop: 1,
  cn_strength: 1,
  cn_upscale: 'None',
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const { settings, loading: settingsLoading, error: settingsError } = useSettings()
  const { checkpoints, loras, refresh: refreshModels } = useModels()
  const { isGenerating, progress, images, error: generateError, generate, stop } = useGenerate()

  const [activeTab, setActiveTab] = useState<'generate' | 'browse' | 'chat' | 'settings'>('generate')
  const [params, setParams] = useState<GenerateRequest>(DEFAULT_PARAMS)
  const [randomSeed, setRandomSeed] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cnPresets, setCnPresets] = useState<ControlNetPreset[]>([])
  const [inpaintEnabled, setInpaintEnabled] = useState(false)

  // Apply server default settings once loaded
  const defaultsApplied = useRef(false)
  useEffect(() => {
    if (settings && !defaultsApplied.current) {
      defaultsApplied.current = true
      const d = settings.default_settings
      setParams((prev) => ({
        ...prev,
        performance_selection:
          typeof d.performance === 'string' ? d.performance : prev.performance_selection,
        sampler_name:
          typeof d.sampler_name === 'string' ? d.sampler_name : prev.sampler_name,
        scheduler:
          typeof d.scheduler === 'string' ? d.scheduler : prev.scheduler,
        cfg: typeof d.cfg === 'number' ? d.cfg : prev.cfg,
        custom_steps:
          typeof d.custom_steps === 'number' ? d.custom_steps : prev.custom_steps,
        clip_skip: typeof d.clip_skip === 'number' ? d.clip_skip : prev.clip_skip,
        auto_negative_prompt:
          typeof d.auto_negative_prompt === 'boolean'
            ? d.auto_negative_prompt
            : prev.auto_negative_prompt,
        style_selection: Array.isArray(d.style) ? d.style : prev.style_selection,
        aspect_ratios_selection:
          typeof d.resolution === 'string' ? d.resolution : prev.aspect_ratios_selection,
      }))
      if (typeof d.seed_random === 'boolean') {
        setRandomSeed(d.seed_random)
      }
      // Initialize CN presets from settings
      if (settings.controlnet_presets) {
        setCnPresets(settings.controlnet_presets)
      }
    }
  }, [settings])

  // Auto-select first checkpoint when models load
  useEffect(() => {
    if (checkpoints.length > 0 && params.base_model_name === '') {
      setParams((prev) => ({ ...prev, base_model_name: checkpoints[0].name }))
    }
  }, [checkpoints, params.base_model_name])

  // When new images complete, select the latest
  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[images.length - 1])
    }
  }, [images])

  const handleGenerate = useCallback(() => {
    const request = { ...params }
    if (randomSeed) {
      request.seed = -1
    }
    generate(request)
  }, [generate, params, randomSeed])

  const handleGallerySelect = useCallback((url: string) => {
    setSelectedImage(url)
  }, [])

  // Loading state
  if (settingsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading settings...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (settingsError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-destructive">
          <span className="text-sm">Failed to load settings: {settingsError}</span>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Build the display image: selected image, or preview during generation
  const displayImages = selectedImage
    ? [selectedImage, ...images.filter((u) => u !== selectedImage)]
    : images

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2 flex items-center gap-4 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">RuinedFooocus</h1>
        <div className="flex gap-1">
          <Button
            variant={activeTab === 'generate' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('generate')}
          >
            Generate
          </Button>
          <Button
            variant={activeTab === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('browse')}
          >
            Browse
          </Button>
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </Button>
        </div>
        <div className="flex-1" />
        {generateError && (
          <span className="text-xs text-destructive">{generateError}</span>
        )}
      </header>

      {activeTab === 'browse' ? (
        <ImageBrowserView />
      ) : activeTab === 'chat' ? (
        <ChatView />
      ) : activeTab === 'settings' ? (
        <SettingsView settings={settings} checkpoints={checkpoints} loras={loras} />
      ) : (
      /* Main content - two column layout */
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Image display */}
        <div className="flex-[3] flex flex-col p-4 gap-4 min-w-0">
          <ImageOutput
            images={displayImages}
            preview={progress?.preview ?? null}
            isGenerating={isGenerating}
          />
          <Gallery images={images} onSelect={handleGallerySelect} />
        </div>

        {/* Right - Controls */}
        <div className="flex-[2] border-l border-border overflow-y-auto p-4 space-y-4">
          <PromptInput
            prompt={params.prompt}
            negativePrompt={params.negative_prompt}
            onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
            onNegativePromptChange={(val) => setParams((p) => ({ ...p, negative_prompt: val }))}
            autoNegativePrompt={params.auto_negative_prompt}
            onAutoNegativePromptChange={(val) =>
              setParams((p) => ({ ...p, auto_negative_prompt: val }))
            }
          />

          <LlamaRewrite
            prompt={params.prompt}
            onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
          />

          <Accordion title="Evolve">
            <EvolvePanel
              prompt={params.prompt}
              onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
              onTriggerGenerate={handleGenerate}
            />
          </Accordion>

          <Accordion title="One Button">
            <OneButtonPrompt
              prompt={params.prompt}
              onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
              onInstantGenerate={handleGenerate}
            />
          </Accordion>

          <GenerateButton
            isGenerating={isGenerating}
            progress={progress}
            onGenerate={handleGenerate}
            onStop={stop}
            imageCount={params.image_number}
            onImageCountChange={(val) => setParams((p) => ({ ...p, image_number: val }))}
          />

          <Accordion title="Model" defaultOpen>
            <ModelSelector
              checkpoints={checkpoints}
              selectedModel={params.base_model_name}
              onModelChange={(val) => setParams((p) => ({ ...p, base_model_name: val }))}
              onRefresh={refreshModels}
            />
          </Accordion>

          <Accordion title="LoRA">
            <LoraSelector
              loras={loras}
              activeLoras={params.loras}
              onLorasChange={(val) => setParams((p) => ({ ...p, loras: val }))}
            />
          </Accordion>

          <Accordion title="Generation Settings">
            <GenerationSettings
              performancePresets={settings?.performance_presets ?? []}
              performance={params.performance_selection}
              onPerformanceChange={(val) =>
                setParams((p) => ({ ...p, performance_selection: val }))
              }
              customSteps={params.custom_steps}
              cfg={params.cfg}
              samplerName={params.sampler_name}
              scheduler={params.scheduler}
              clipSkip={params.clip_skip}
              samplers={settings?.samplers ?? []}
              schedulers={settings?.schedulers ?? []}
              onStepsChange={(val) => setParams((p) => ({ ...p, custom_steps: val }))}
              onCfgChange={(val) => setParams((p) => ({ ...p, cfg: val }))}
              onSamplerChange={(val) => setParams((p) => ({ ...p, sampler_name: val }))}
              onSchedulerChange={(val) => setParams((p) => ({ ...p, scheduler: val }))}
              onClipSkipChange={(val) => setParams((p) => ({ ...p, clip_skip: val }))}
            />
          </Accordion>

          <Accordion title="Resolution">
            <ResolutionPicker
              resolutions={settings?.resolutions ?? []}
              selected={params.aspect_ratios_selection}
              customWidth={params.custom_width}
              customHeight={params.custom_height}
              onResolutionChange={(val) =>
                setParams((p) => ({ ...p, aspect_ratios_selection: val }))
              }
              onWidthChange={(val) => setParams((p) => ({ ...p, custom_width: val }))}
              onHeightChange={(val) => setParams((p) => ({ ...p, custom_height: val }))}
            />
          </Accordion>

          <Accordion title="Style">
            <StyleSelector
              styles={settings?.styles ?? []}
              selectedStyles={params.style_selection}
              onStylesChange={(val) => setParams((p) => ({ ...p, style_selection: val }))}
            />
          </Accordion>

          <Accordion title="PowerUp">
            <ControlNetPanel
              presets={cnPresets}
              types={settings?.controlnet_types ?? []}
              upscalers={settings?.upscalers ?? []}
              cnSelection={params.cn_selection ?? 'None'}
              cnType={params.cn_type ?? 'Canny'}
              cnEdgeLow={params.cn_edge_low}
              cnEdgeHigh={params.cn_edge_high}
              cnStart={params.cn_start}
              cnStop={params.cn_stop}
              cnStrength={params.cn_strength}
              cnUpscale={params.cn_upscale}
              onSelectionChange={(val) => setParams((p) => ({ ...p, cn_selection: val }))}
              onTypeChange={(val) => setParams((p) => ({ ...p, cn_type: val }))}
              onEdgeLowChange={(val) => setParams((p) => ({ ...p, cn_edge_low: val }))}
              onEdgeHighChange={(val) => setParams((p) => ({ ...p, cn_edge_high: val }))}
              onStartChange={(val) => setParams((p) => ({ ...p, cn_start: val }))}
              onStopChange={(val) => setParams((p) => ({ ...p, cn_stop: val }))}
              onStrengthChange={(val) => setParams((p) => ({ ...p, cn_strength: val }))}
              onUpscaleChange={(val) => setParams((p) => ({ ...p, cn_upscale: val }))}
              onPresetsUpdate={setCnPresets}
            />
            <div className="mt-3">
              <ImageUpload
                image={params.input_image}
                onImageChange={(val) => setParams((p) => ({ ...p, input_image: val }))}
              />
            </div>
            <div className="mt-3">
              <InpaintCanvas
                sourceImage={params.input_image}
                enabled={inpaintEnabled}
                onEnabledChange={setInpaintEnabled}
                onMaskChange={(composite) => {
                  if (composite) {
                    setParams((p) => ({ ...p, input_image: composite }))
                  }
                }}
              />
            </div>
          </Accordion>

          <Accordion title="Seed">
            <SeedControl
              seed={params.seed}
              randomSeed={randomSeed}
              onSeedChange={(val) => setParams((p) => ({ ...p, seed: val }))}
              onRandomSeedChange={setRandomSeed}
            />
          </Accordion>
        </div>
      </div>
      )}
    </div>
  )
}
