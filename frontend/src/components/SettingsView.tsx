import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/api/client'
import type {
  SettingsData,
  ModelInfo,
  LoraInfo,
  PathsData,
  ModelFilesData,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingsDict = Record<string, unknown>

interface SettingsViewProps {
  settings: SettingsData | null
  checkpoints: ModelInfo[]
  loras: LoraInfo[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground pb-1 mb-3">{children}</h3>
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div className="space-y-1 flex-1">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-8 text-[15px] glass-input border-none rounded-lg"
        value={value ?? ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      <Input
        className="h-8 text-[15px] glass-input border-none rounded-lg"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function CheckField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={value} onCheckedChange={onChange} />
      <Label className="text-[15px] cursor-pointer" onClick={() => onChange(!value)}>
        {label}
      </Label>
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      <Textarea
        className="text-[15px] min-h-[80px] font-mono glass-input border-none rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ModelSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null | undefined
  options: string[]
  onChange: (v: string) => void
}) {
  const selectOptions = [
    { value: '__none__', label: 'None' },
    ...options.map((o) => ({ value: o, label: o })),
  ]
  return (
    <div className="space-y-1">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      <Select
        value={value || '__none__'}
        onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
        options={selectOptions}
        className="h-8 text-[15px] glass-input border-none rounded-lg"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SettingsView({ settings, checkpoints, loras }: SettingsViewProps) {
  const [local, setLocal] = useState<SettingsDict>({})
  const [paths, setPaths] = useState<PathsData>({})
  const [modelFiles, setModelFiles] = useState<ModelFilesData>({ clip: [], clip_vision: [], vae: [], llm: [] })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load settings, paths, and model files on mount
  useEffect(() => {
    if (!settings) return

    setLocal({ ...settings.default_settings })

    Promise.all([api.getPaths(), api.getModelFiles()])
      .then(([pathsRes, mf]) => {
        setPaths(pathsRes.paths)
        setModelFiles(mf)
        setLoaded(true)
      })
      .catch(console.error)
  }, [settings])

  const set = useCallback((key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setPath = useCallback((key: string, value: string | string[]) => {
    setPaths((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      // Split path_* keys out of local settings
      const settingsToSave: Record<string, unknown> = {}
      const pathsToSave: Record<string, unknown> = {}

      for (const [key, val] of Object.entries(local)) {
        if (key.startsWith('path_')) {
          pathsToSave[key] = val
        } else {
          settingsToSave[key] = val
        }
      }

      // Include paths from the paths state
      for (const [key, val] of Object.entries(paths)) {
        pathsToSave[key] = val
      }

      await api.saveSettings({
        settings: settingsToSave,
        paths: Object.keys(pathsToSave).length > 0 ? pathsToSave : undefined,
      })
      setMessage('Settings saved successfully')
    } catch (err) {
      setMessage(`Error: ${err}`)
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (!settings || !loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      </div>
    )
  }

  // Helper for list fields (archive_folders, path_checkpoints, path_loras)
  const listToText = (val: unknown): string => {
    if (Array.isArray(val)) return val.join('\n')
    if (typeof val === 'string') return val
    return ''
  }

  const textToList = (text: string): string[] =>
    text.split('\n').map((s) => s.trim()).filter(Boolean)

  // Build options for dropdowns
  const checkpointOptions = checkpoints.map((c) => ({ value: c.name, label: c.name }))
  const loraOptions = [
    { value: 'None', label: 'None' },
    ...loras.map((l) => ({ value: l.name, label: l.name })),
  ]
  const perfOptions = settings.performance_presets.map((p) => ({ value: p.name, label: p.name }))
  const resOptions = settings.resolutions.map((r) => ({ value: r.label, label: r.label }))
  const styleNames = settings.styles.map((s) => s.name)

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-4 pt-[49px] pb-[58px]">
        {/* Three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 — Generation Defaults */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Generation Defaults</SectionHeader>

              <FieldRow>
                <NumberField
                  label="Image Number"
                  value={local.image_number as number}
                  onChange={(v) => set('image_number', v)}
                  min={1}
                  step={1}
                />
                <NumberField
                  label="Image Number Max"
                  value={local.image_number_max as number ?? 50}
                  onChange={(v) => set('image_number_max', v)}
                  min={1}
                  step={1}
                />
              </FieldRow>

              <FieldRow>
                <NumberField
                  label="Seed"
                  value={local.seed as number}
                  onChange={(v) => set('seed', v)}
                  min={-1}
                  step={1}
                />
                <div className="flex-1 pt-5">
                  <CheckField
                    label="Random Seed"
                    value={local.seed_random as boolean ?? true}
                    onChange={(v) => set('seed_random', v)}
                  />
                </div>
              </FieldRow>

              {/* Style multi-select: display as checkboxes */}
              <div className="space-y-1">
                <Label className="text-[13px] text-muted-foreground">Default Styles</Label>
                <div className="max-h-32 overflow-y-auto bg-background rounded-lg p-2 space-y-1">
                  {styleNames.map((name) => {
                    const selected = Array.isArray(local.style) ? (local.style as string[]) : []
                    const isChecked = selected.includes(name)
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newStyles = checked
                              ? [...selected, name]
                              : selected.filter((s) => s !== name)
                            set('style', newStyles)
                          }}
                        />
                        <span className="text-[13px]">{name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <TextField
                label="Default Prompt"
                value={local.prompt as string}
                onChange={(v) => set('prompt', v)}
              />
              <TextField
                label="Default Negative Prompt"
                value={local.negative_prompt as string}
                onChange={(v) => set('negative_prompt', v)}
              />
              <CheckField
                label="Auto Negative Prompt"
                value={local.auto_negative_prompt as boolean ?? false}
                onChange={(v) => set('auto_negative_prompt', v)}
              />

              <div className="space-y-1">
                <Label className="text-[13px] text-muted-foreground">Performance</Label>
                <Select
                  value={(local.performance as string) ?? 'Speed'}
                  onValueChange={(v) => set('performance', v)}
                  options={perfOptions}
                  className="h-8 text-[15px] bg-background border-none rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[13px] text-muted-foreground">Resolution</Label>
                <Select
                  value={(local.resolution as string) ?? '1152x896 (4:3)'}
                  onValueChange={(v) => set('resolution', v)}
                  options={resOptions}
                  className="h-8 text-[15px] bg-background border-none rounded-lg"
                />
              </div>

              <FieldRow>
                <NumberField
                  label="LoRA Weight Min"
                  value={local.lora_min as number ?? 0}
                  onChange={(v) => set('lora_min', v)}
                  step={0.1}
                />
                <NumberField
                  label="LoRA Weight Max"
                  value={local.lora_max as number ?? 2}
                  onChange={(v) => set('lora_max', v)}
                  step={0.1}
                />
              </FieldRow>
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Startup Models</SectionHeader>

              <div className="space-y-1">
                <Label className="text-[13px] text-muted-foreground">Base Model</Label>
                <Select
                  value={(local.base_model as string) ?? ''}
                  onValueChange={(v) => set('base_model', v)}
                  options={checkpointOptions}
                  className="h-8 text-[15px] bg-background border-none rounded-lg"
                />
              </div>

              {[1, 2, 3, 4, 5].map((i) => (
                <FieldRow key={i}>
                  <div className="space-y-1 flex-[2]">
                    <Label className="text-[13px] text-muted-foreground">LoRA {i}</Label>
                    <Select
                      value={(local[`lora_${i}_model`] as string) ?? 'None'}
                      onValueChange={(v) => set(`lora_${i}_model`, v)}
                      options={loraOptions}
                      className="h-8 text-[15px] bg-background border-none rounded-lg"
                    />
                  </div>
                  <NumberField
                    label="Weight"
                    value={local[`lora_${i}_weight`] as number ?? 0.5}
                    onChange={(v) => set(`lora_${i}_weight`, v)}
                    step={0.05}
                    min={0}
                    max={2}
                  />
                </FieldRow>
              ))}
            </div>
          </div>

          {/* Column 2 — Features & Paths */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>One Button Prompt</SectionHeader>
              <TextField
                label="OBP Preset"
                value={local.OBP_preset as string}
                onChange={(v) => set('OBP_preset', v)}
              />
              <NumberField
                label="Hint Chance"
                value={local.hint_chance as number ?? 25}
                onChange={(v) => set('hint_chance', v)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Image Browser</SectionHeader>
              <NumberField
                label="Images per Page"
                value={local.images_per_page as number ?? 100}
                onChange={(v) => set('images_per_page', v)}
                min={1}
                max={1000}
                step={1}
              />
              <TextAreaField
                label="Archive Folders"
                value={listToText(local.archive_folders)}
                onChange={(v) => set('archive_folders', textToList(v))}
                hint="One folder per line"
              />
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Paths</SectionHeader>
              <TextAreaField
                label="Checkpoint Folders"
                value={listToText(paths.path_checkpoints)}
                onChange={(v) => setPath('path_checkpoints', textToList(v))}
                hint="One folder per line"
              />
              <TextAreaField
                label="LoRA Folders"
                value={listToText(paths.path_loras)}
                onChange={(v) => setPath('path_loras', textToList(v))}
                hint="One folder per line"
              />
              <TextField
                label="Inbox Folder"
                value={paths.path_inbox as string}
                onChange={(v) => setPath('path_inbox', v)}
                placeholder="../models/inbox"
              />
              <TextField
                label="Output Folder"
                value={paths.path_outputs as string}
                onChange={(v) => setPath('path_outputs', v)}
                placeholder="../outputs/"
              />
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Chatbot</SectionHeader>
              <ModelSelect
                label="Local LLM File"
                value={local.llama_localfile as string}
                options={modelFiles.llm}
                onChange={(v) => set('llama_localfile', v || null)}
              />
              <FieldRow>
                <NumberField
                  label="n_predict"
                  value={local.llm_n_predict as number}
                  onChange={(v) => set('llm_n_predict', v)}
                  min={-1}
                  step={1}
                />
                <NumberField
                  label="n_ctx"
                  value={local.llm_n_ctx as number}
                  onChange={(v) => set('llm_n_ctx', v)}
                  min={0}
                  step={1}
                />
              </FieldRow>
              <FieldRow>
                <NumberField
                  label="n_gpu_layers"
                  value={local.llm_n_gpu_layers as number}
                  onChange={(v) => set('llm_n_gpu_layers', v)}
                  min={-1}
                  step={1}
                />
                <NumberField
                  label="Chat History"
                  value={local.llm_chat_history as number}
                  onChange={(v) => set('llm_chat_history', v)}
                  min={0}
                  step={1}
                />
              </FieldRow>
              <CheckField
                label="Enable Image Generation"
                value={local.enable_llm_tools as boolean ?? false}
                onChange={(v) => set('enable_llm_tools', v)}
              />
              <NumberField
                label="Max Tokens (Hyperprompting)"
                value={local.llm_hp_max_tokens as number}
                onChange={(v) => set('llm_hp_max_tokens', v)}
                min={0}
                step={1}
              />
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Other</SectionHeader>
              <CheckField
                label="Save Metadata"
                value={local.save_metadata as boolean ?? true}
                onChange={(v) => set('save_metadata', v)}
              />
              <TextField
                label="Theme"
                value={local.theme as string}
                onChange={(v) => set('theme', v)}
              />
            </div>
          </div>

          {/* Column 3 — Advanced Model Overrides */}
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>CLIP Models</SectionHeader>
              {[
                'clip_aura', 'clip_g', 'clip_gemma', 'clip_l', 'clip_llama',
                'clip_llava', 'clip_mistral3', 'clip_qwen25', 'clip_qwen3',
                'clip_oldt5', 'clip_t5', 'clip_umt5',
              ].map((key) => (
                <ModelSelect
                  key={key}
                  label={key}
                  value={local[key] as string}
                  options={modelFiles.clip}
                  onChange={(v) => set(key, v || null)}
                />
              ))}
              <ModelSelect
                label="clip_vision"
                value={local.clip_vision as string}
                options={modelFiles.clip_vision}
                onChange={(v) => set('clip_vision', v || null)}
              />
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>Shift Parameters</SectionHeader>
              {[
                { key: 'auraflow_shift', label: 'AuraFlow Shift', placeholder: '1.73' },
                { key: 'lumina2_shift', label: 'Lumina2 Shift', placeholder: '3.0' },
                { key: 'hidream_shift', label: 'HiDream Shift', placeholder: '3.0' },
                { key: 'sd3_shift', label: 'SD3 Shift', placeholder: '3.0' },
                { key: 'qwen_image_shift', label: 'Qwen Image Shift', placeholder: '3.1' },
              ].map(({ key, label, placeholder }) => (
                <TextField
                  key={key}
                  label={label}
                  value={local[key] as string}
                  onChange={(v) => set(key, v || null)}
                  placeholder={placeholder}
                />
              ))}
            </div>

            <div className="glass-card rounded-xl p-4 space-y-4">
              <SectionHeader>VAE Models</SectionHeader>
              {[
                { key: 'vae_auraflow', label: 'AuraFlow VAE' },
                { key: 'vae_flux', label: 'Flux VAE' },
                { key: 'vae_flux2', label: 'Flux2 VAE' },
                { key: 'vae_hunyuan_video', label: 'Hunyuan Video VAE' },
                { key: 'vae_lumina2', label: 'Lumina2 VAE' },
                { key: 'vae_qwen_image', label: 'Qwen Image VAE' },
                { key: 'vae_pixart', label: 'PixArt VAE' },
                { key: 'vae_sd', label: 'SD1.5 VAE' },
                { key: 'vae_sd3', label: 'SD3 VAE' },
                { key: 'vae_sdxl', label: 'SDXL/Pony VAE' },
                { key: 'vae_wan', label: 'WAN 2.1 VAE' },
                { key: 'vae_wan_22', label: 'WAN 2.2 VAE' },
              ].map(({ key, label }) => (
                <ModelSelect
                  key={key}
                  label={label}
                  value={local[key] as string}
                  options={modelFiles.vae}
                  onChange={(v) => set(key, v || null)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving} className="rounded-xl">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
          {message && (
            <span className={`text-[15px] ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
