import { useState, useCallback, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { useSettings } from '@/hooks/useSettings'
import { useModels } from '@/hooks/useModels'
import { useGenerate } from '@/hooks/useGenerate'

import type { GenerateRequest, ControlNetPreset } from '@/api/types'
import { api } from '@/api/client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion } from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
import { MetadataViewer } from '@/components/MetadataViewer'
import { PresetSelector } from '@/components/PresetSelector'
import { WildcardDropdown } from '@/components/WildcardDropdown'
import { cn } from '@/lib/utils'

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
// Bottom tab bar item
// ---------------------------------------------------------------------------

function TabBarItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2.5 px-4 text-[13px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const { settings, loading: settingsLoading, error: settingsError } = useSettings()
  const { checkpoints, loras, refresh: refreshModels } = useModels()
  const { isGenerating, progress, images, error: generateError, generate, stop } = useGenerate()

  const [activeTab, setActiveTab] = useState<'generate' | 'browse' | 'chat' | 'settings'>('generate')
  const [activeRightTab, setActiveRightTab] = useState<string>('setting')
  const [activeModelTab, setActiveModelTab] = useState<string>('model')
  const [params, setParams] = useState<GenerateRequest>(DEFAULT_PARAMS)
  const [randomSeed, setRandomSeed] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cnPresets, setCnPresets] = useState<ControlNetPreset[]>([])
  const [inpaintEnabled, setInpaintEnabled] = useState(false)
  const [originalInputImage, setOriginalInputImage] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [prePresetParams, setPrePresetParams] = useState<GenerateRequest | null>(null)
  const [presetKeys, setPresetKeys] = useState<string[]>([])
  const [hint, setHint] = useState<string | null>(null)

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
    // Fetch a random hint to display during generation
    api.getHint().then((r) => setHint(r.hint)).catch((e) => console.warn('Failed to fetch hint:', e))
  }, [generate, params, randomSeed])

  // Keyboard shortcut: Ctrl+Enter = Generate
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleGenerate])

  const handleGallerySelect = useCallback((url: string) => {
    setSelectedImage(url)
  }, [])

  const handleApplyPreset = useCallback((overrides: Partial<GenerateRequest>) => {
    setPresetKeys(Object.keys(overrides))
    setParams((current) => {
      setPrePresetParams({ ...current })
      return { ...current, ...overrides }
    })
  }, [])

  const handleClearPreset = useCallback(() => {
    if (prePresetParams) {
      setParams((current) => {
        const restored = { ...current }
        for (const key of presetKeys) {
          const k = key as keyof GenerateRequest
          ;(restored as Record<keyof GenerateRequest, unknown>)[k] =
            prePresetParams[k]
        }
        return restored
      })
      setPrePresetParams(null)
      setPresetKeys([])
    }
  }, [prePresetParams, presetKeys])

  const handleSendStyleToPrompt = useCallback(async () => {
    if (params.style_selection.length === 0) return
    try {
      const result = await api.applyStyles(
        params.style_selection,
        params.prompt,
        params.negative_prompt
      )
      setParams((p) => ({
        ...p,
        prompt: result.prompt,
        negative_prompt: result.negative_prompt,
        style_selection: [],
      }))
    } catch (e) {
      console.error('Failed to apply styles:', e)
    }
  }, [params.style_selection, params.prompt, params.negative_prompt])

  // Loading state
  if (settingsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-[15px]">Loading...</span>
        </div>
      </div>
    )
  }

  const displayImages = selectedImage
    ? [selectedImage, ...images.filter((u) => u !== selectedImage)]
    : images

  return (
    <div className="h-screen relative bg-background">
      {/* iOS-style navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-bar glass-bar-edge-bottom px-4 pt-2 pb-1.5 flex items-center">
        <h1 className="text-[17px] font-serif-display font-semibold text-foreground">RuinedFooocus</h1>
        <div className="flex-1" />
        {settingsError && (
          <span className="text-[12px] text-orange-500 font-medium">Offline</span>
        )}
        {generateError && (
          <span className="text-[12px] text-destructive font-medium">{generateError}</span>
        )}
      </header>

      {/* Main content area */}
      <div className="absolute inset-0 overflow-hidden">
        {activeTab === 'browse' ? (
          <ImageBrowserView />
        ) : activeTab === 'chat' ? (
          <ChatView />
        ) : activeTab === 'settings' ? (
          <SettingsView settings={settings} checkpoints={checkpoints} loras={loras} />
        ) : (
          /* ============================================================
             GENERATE TAB — Gradio-style two-column layout
             LEFT (5): Preview + Progress + Gallery + Prompt + Generate
             RIGHT (2): Tabs (Setting, Models, OneButton, PowerUp, Info)
             ============================================================ */
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">

            {/* ── LEFT COLUMN ── */}
            <div className="flex-[5] flex flex-col px-4 pt-[49px] pb-[58px] gap-3 min-w-0 overflow-y-auto">
              {/* Image preview / Inpaint editor — swaps in place */}
              {inpaintEnabled && originalInputImage ? (
                <InpaintCanvas
                  sourceImage={originalInputImage}
                  enabled={inpaintEnabled}
                  onEnabledChange={(enabled) => {
                    setInpaintEnabled(enabled)
                    if (!enabled && originalInputImage) {
                      setParams((p) => ({ ...p, input_image: originalInputImage }))
                    }
                  }}
                  onMaskChange={(composite) => {
                    if (composite) {
                      setParams((p) => ({ ...p, input_image: composite }))
                    } else if (originalInputImage) {
                      setParams((p) => ({ ...p, input_image: originalInputImage }))
                    }
                  }}
                />
              ) : (
                <ImageOutput
                  images={displayImages}
                  preview={progress?.preview ?? null}
                  isGenerating={isGenerating}
                  onInterrogateResult={(prompt) => setParams((p) => ({ ...p, prompt }))}
                />
              )}

              {/* Progress bar — only during generation */}
              {isGenerating && progress && (
                <div className="space-y-1 px-1">
                  <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
                    />
                  </div>
                  {progress.status && (
                    <p className="text-[13px] text-muted-foreground text-center">
                      {progress.status}
                    </p>
                  )}
                  {hint && (
                    <p className="text-[12px] text-muted-foreground/70 text-center italic">
                      {hint.replace(/\*\*/g, '').replace(/\*/g, '')}
                    </p>
                  )}
                </div>
              )}

              {/* Gallery strip */}
              <Gallery images={images} onSelect={handleGallerySelect} />

              {/* Prompt + Generate row — matches Gradio layout */}
              <div className="flex gap-3 items-stretch">
                <div className="flex-[5] min-w-0 space-y-1">
                  <PromptInput
                    prompt={params.prompt}
                    onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
                  />
                  <WildcardDropdown
                    prompt={params.prompt}
                    onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
                  />
                </div>
                <div className="flex-[1] flex flex-col gap-2 min-w-[80px]">
                  <GenerateButton
                    isGenerating={isGenerating}
                    progress={null}
                    onGenerate={handleGenerate}
                    onStop={stop}
                  />
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN — Tabs ── */}
            <div className="flex-[2] flex flex-col px-4 pt-[49px] pb-[58px] min-w-0">
              <Tabs value={activeRightTab} onValueChange={setActiveRightTab}>
                <TabsList>
                  <TabsTrigger value="setting">Setting</TabsTrigger>
                  {!activePreset && <TabsTrigger value="models">Models</TabsTrigger>}
                  <TabsTrigger value="onebutton">One Button</TabsTrigger>
                  <TabsTrigger value="powerup">PowerUp</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                {/* ── Setting Tab ── */}
                <TabsContent value="setting">
                  <PresetSelector
                    activePreset={activePreset}
                    onActivePresetChange={setActivePreset}
                    onApplyPreset={handleApplyPreset}
                    onClearPreset={handleClearPreset}
                  />

                  {!activePreset && (<>
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
                  </>)}

                  <StyleSelector
                    styles={settings?.styles ?? []}
                    selectedStyles={params.style_selection}
                    onStylesChange={(val) => setParams((p) => ({ ...p, style_selection: val }))}
                    onSendToPrompt={handleSendStyleToPrompt}
                  />

                  {/* Image Number */}
                  <div className="glass-card rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px]">Image Number</Label>
                      <span className="text-[13px] text-muted-foreground">
                        {params.image_number === 0 ? 'Forever' : params.image_number}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={50}
                      step={1}
                      value={params.image_number}
                      onValueChange={(val) => setParams((p) => ({ ...p, image_number: val }))}
                    />
                  </div>

                  {/* Negative Prompt */}
                  <div className="glass-card rounded-xl p-3 space-y-2">
                    <Checkbox
                      checked={params.auto_negative_prompt}
                      onCheckedChange={(val) =>
                        setParams((p) => ({ ...p, auto_negative_prompt: val as boolean }))
                      }
                      label="Auto negative prompt"
                    />
                    <Textarea
                      rows={3}
                      placeholder="Negative prompt..."
                      value={params.negative_prompt}
                      onChange={(e) => setParams((p) => ({ ...p, negative_prompt: e.target.value }))}
                      disabled={params.auto_negative_prompt}
                      className="resize-none"
                    />
                  </div>

                  {/* Seed */}
                  <SeedControl
                    seed={params.seed}
                    randomSeed={randomSeed}
                    onSeedChange={(val) => setParams((p) => ({ ...p, seed: val }))}
                    onRandomSeedChange={setRandomSeed}
                  />
                </TabsContent>

                {/* ── Models Tab (nested sub-tabs) ── */}
                <TabsContent value="models">
                  <Tabs value={activeModelTab} onValueChange={setActiveModelTab}>
                    <TabsList>
                      <TabsTrigger value="model">Model</TabsTrigger>
                      <TabsTrigger value="loras">LoRAs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="model">
                      <ModelSelector
                        checkpoints={checkpoints}
                        selectedModel={params.base_model_name}
                        onModelChange={(val) => setParams((p) => ({ ...p, base_model_name: val }))}
                        onRefresh={refreshModels}
                      />
                    </TabsContent>

                    <TabsContent value="loras">
                      <LoraSelector
                        loras={loras}
                        activeLoras={params.loras}
                        onLorasChange={(val) => setParams((p) => ({ ...p, loras: val }))}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* ── One Button Tab ── */}
                <TabsContent value="onebutton">
                  <OneButtonPrompt
                    prompt={params.prompt}
                    onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
                    onInstantGenerate={handleGenerate}
                  />
                </TabsContent>

                {/* ── PowerUp Tab ── */}
                <TabsContent value="powerup">
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

                  <ImageUpload
                    image={params.input_image}
                    onImageChange={(val) => {
                      setOriginalInputImage(val)
                      setParams((p) => ({ ...p, input_image: val }))
                    }}
                  />

                  {/* Inpaint toggle */}
                  <div className="glass-card rounded-xl p-3">
                    <Checkbox
                      checked={inpaintEnabled}
                      onCheckedChange={(val) => {
                        const enabled = val as boolean
                        setInpaintEnabled(enabled)
                        if (!enabled && originalInputImage) {
                          setParams((p) => ({ ...p, input_image: originalInputImage }))
                        }
                      }}
                      label="Inpainting"
                      disabled={!originalInputImage}
                    />
                  </div>

                  <Accordion title="Evolve">
                    <EvolvePanel
                      prompt={params.prompt}
                      onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
                      onTriggerGenerate={handleGenerate}
                    />
                  </Accordion>

                  <LlamaRewrite
                    prompt={params.prompt}
                    onPromptChange={(val) => setParams((p) => ({ ...p, prompt: val }))}
                  />
                </TabsContent>

                {/* ── Info Tab ── */}
                <TabsContent value="info">
                  <MetadataViewer imageUrl={selectedImage} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-bar glass-bar-edge-top flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)]">
        <TabBarItem
          label="Generate"
          active={activeTab === 'generate'}
          onClick={() => setActiveTab('generate')}
        />
        <TabBarItem
          label="Browse"
          active={activeTab === 'browse'}
          onClick={() => setActiveTab('browse')}
        />
        <TabBarItem
          label="Chat"
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        />
        <TabBarItem
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>
    </div>
  )
}
