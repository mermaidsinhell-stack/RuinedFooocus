import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { api } from "@/api/client"
import type { OBPOptions, OBPPreset } from "@/api/types"

const CUSTOM_VALUE = "Custom..."
const RANDOM_VALUE = "All (random)..."

const DEFAULT_OBP: OBPPreset = {
  insanitylevel: 5,
  subject: "all",
  artist: "all",
  imagetype: "all",
  imagemodechance: 20,
  chosengender: "all",
  chosensubjectsubtypeobject: "all",
  chosensubjectsubtypehumanoid: "all",
  chosensubjectsubtypeconcept: "all",
  givensubject: "",
  smartsubject: true,
  givenoutfit: "",
  prefixprompt: "",
  suffixprompt: "",
  giventypeofimage: "",
  antistring: "",
}

export interface OneButtonPromptProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  onInstantGenerate: () => void
}

export function OneButtonPrompt({
  prompt,
  onPromptChange,
  onInstantGenerate,
}: OneButtonPromptProps) {
  const [options, setOptions] = React.useState<OBPOptions | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)

  const [preset, setPreset] = React.useState(RANDOM_VALUE)
  const [form, setForm] = React.useState<OBPPreset>(DEFAULT_OBP)
  const [promptEnhance, setPromptEnhance] = React.useState("none")
  const [modelType, setModelType] = React.useState("SDXL")
  const [saveName, setSaveName] = React.useState("")

  const isCustom = preset === CUSTOM_VALUE

  // Load options on mount
  React.useEffect(() => {
    setLoading(true)
    api.getOBPOptions()
      .then((opts) => {
        setOptions(opts)
        // Apply default preset values if available
        if (opts.presets["Standard"]) {
          setForm({ ...DEFAULT_OBP, ...opts.presets["Standard"] })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handlePresetChange(value: string) {
    setPreset(value)
    if (value !== CUSTOM_VALUE && value !== RANDOM_VALUE && options?.presets[value]) {
      setForm({ ...DEFAULT_OBP, ...options.presets[value] })
    }
  }

  async function callGenerate(): Promise<string> {
    const result = await api.generateOBPPrompt({
      insanitylevel: form.insanitylevel,
      subject: form.subject,
      artist: form.artist,
      imagetype: form.imagetype,
      antistring: form.antistring,
      prefixprompt: form.prefixprompt,
      suffixprompt: form.suffixprompt,
      givensubject: form.givensubject,
      smartsubject: form.smartsubject,
      giventypeofimage: form.giventypeofimage,
      imagemodechance: form.imagemodechance,
      chosengender: form.chosengender,
      chosensubjectsubtypeobject: form.chosensubjectsubtypeobject,
      chosensubjectsubtypehumanoid: form.chosensubjectsubtypehumanoid,
      chosensubjectsubtypeconcept: form.chosensubjectsubtypeconcept,
      givenoutfit: form.givenoutfit,
      obp_preset: preset === CUSTOM_VALUE ? "" : preset,
      promptenhance: promptEnhance,
      modeltype: modelType,
    })
    return result.prompt
  }

  async function handleRandomPrompt() {
    setGenerating(true)
    try {
      const newPrompt = await callGenerate()
      onPromptChange(newPrompt)
    } finally {
      setGenerating(false)
    }
  }

  async function handleInstantOBP() {
    setGenerating(true)
    try {
      const newPrompt = await callGenerate()
      onPromptChange(newPrompt)
      // Trigger generation after prompt is set
      setTimeout(onInstantGenerate, 50)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAddPrompt() {
    setGenerating(true)
    try {
      const newPrompt = await callGenerate()
      onPromptChange(prompt ? `${prompt}---${newPrompt}` : newPrompt)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSavePreset() {
    if (!saveName.trim() || !options) return
    await api.saveOBPPreset({ name: saveName.trim(), ...form })
    // Refresh options to get updated presets
    const opts = await api.getOBPOptions()
    setOptions(opts)
    setPreset(saveName.trim())
    setSaveName("")
  }

  if (loading || !options) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading OBP options...
      </div>
    )
  }

  const subjectOptions = options.subjects.map((s) => ({
    value: s,
    label: s,
  }))
  const artistOptions = options.artists.map((a) => ({ value: a, label: a }))
  const imageTypeOptions = options.imagetypes.map((t) => ({ value: t, label: t }))
  const genderOptions = options.genders.map((g) => ({ value: g, label: g }))
  const modelOptions = options.model_types.map((m) => ({ value: m, label: m }))
  const enhanceOptions = options.prompt_enhance.map((e) => ({ value: e, label: e }))
  const presetOptions = options.preset_names.map((p) => ({ value: p, label: p }))
  const subtypeObjectOptions = options.subtype_object.map((s) => ({ value: s, label: s }))
  const subtypeHumanoidOptions = options.subtype_humanoid.map((s) => ({ value: s, label: s }))
  const subtypeConceptOptions = options.subtype_concept.map((s) => ({ value: s, label: s }))

  const showGender = form.subject.includes("human")
  const showSubtypeObject = form.subject === "object"
  const showSubtypeHumanoid = form.subject === "humanoid" || form.subject.includes("human")
  const showSubtypeConcept = form.subject === "concept"

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstantOBP}
          disabled={generating}
          className="flex-1 rounded-lg"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Instant OBP
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomPrompt}
          disabled={generating}
          className="flex-1 rounded-lg"
        >
          Random Prompt
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPrompt}
          disabled={generating}
          className="w-10 rounded-lg"
        >
          +
        </Button>
      </div>

      {/* Preset selector */}
      <div className="space-y-1.5">
        <Label className="text-[15px]">One Button Preset</Label>
        <Select
          value={preset}
          onValueChange={handlePresetChange}
          options={presetOptions}
        />
      </div>

      {/* Custom configuration form */}
      {isCustom && (
        <div className="space-y-3 bg-background rounded-xl p-4">
          {/* Insanity level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[15px]">Insanity Level</Label>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {form.insanitylevel}
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={form.insanitylevel}
              onValueChange={(v) => setForm((f) => ({ ...f, insanitylevel: v }))}
            />
          </div>

          {/* Subject + Artist */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[15px]">Subject</Label>
              <Select
                value={form.subject}
                onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                options={subjectOptions}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[15px]">Artist</Label>
              <Select
                value={form.artist}
                onValueChange={(v) => setForm((f) => ({ ...f, artist: v }))}
                options={artistOptions}
              />
            </div>
          </div>

          {/* Conditional subtypes */}
          {showSubtypeObject && (
            <div className="space-y-1.5">
              <Label className="text-[15px]">Type of object</Label>
              <Select
                value={form.chosensubjectsubtypeobject}
                onValueChange={(v) => setForm((f) => ({ ...f, chosensubjectsubtypeobject: v }))}
                options={subtypeObjectOptions}
              />
            </div>
          )}

          {showSubtypeHumanoid && (
            <div className="space-y-1.5">
              <Label className="text-[15px]">Type of humanoid</Label>
              <Select
                value={form.chosensubjectsubtypehumanoid}
                onValueChange={(v) => setForm((f) => ({ ...f, chosensubjectsubtypehumanoid: v }))}
                options={subtypeHumanoidOptions}
              />
            </div>
          )}

          {showSubtypeConcept && (
            <div className="space-y-1.5">
              <Label className="text-[15px]">Type of concept</Label>
              <Select
                value={form.chosensubjectsubtypeconcept}
                onValueChange={(v) => setForm((f) => ({ ...f, chosensubjectsubtypeconcept: v }))}
                options={subtypeConceptOptions}
              />
            </div>
          )}

          {showGender && (
            <div className="space-y-1.5">
              <Label className="text-[15px]">Gender</Label>
              <Select
                value={form.chosengender}
                onValueChange={(v) => setForm((f) => ({ ...f, chosengender: v }))}
                options={genderOptions}
              />
            </div>
          )}

          {/* Image type + mode chance */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[15px]">Image Type</Label>
              <Select
                value={form.imagetype}
                onValueChange={(v) => setForm((f) => ({ ...f, imagetype: v }))}
                options={imageTypeOptions}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[15px]">Mode Chance</Label>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  1/{form.imagemodechance}
                </span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={form.imagemodechance}
                onValueChange={(v) => setForm((f) => ({ ...f, imagemodechance: v }))}
              />
            </div>
          </div>

          {/* Override options */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Override options</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Override subject..."
                value={form.givensubject}
                onChange={(e) => setForm((f) => ({ ...f, givensubject: e.target.value }))}
              />
              <Input
                placeholder="Override outfit..."
                value={form.givenoutfit}
                onChange={(e) => setForm((f) => ({ ...f, givenoutfit: e.target.value }))}
              />
            </div>
            <Checkbox
              checked={form.smartsubject}
              onCheckedChange={(v) => setForm((f) => ({ ...f, smartsubject: v }))}
              label="Smart subject"
            />
          </div>

          {/* Prompt fields */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Prompt fields</p>
            <Input
              placeholder="Prefix prompt..."
              value={form.prefixprompt}
              onChange={(e) => setForm((f) => ({ ...f, prefixprompt: e.target.value }))}
            />
            <Input
              placeholder="Suffix prompt..."
              value={form.suffixprompt}
              onChange={(e) => setForm((f) => ({ ...f, suffixprompt: e.target.value }))}
            />
            <Input
              placeholder="Override image type..."
              value={form.giventypeofimage}
              onChange={(e) => setForm((f) => ({ ...f, giventypeofimage: e.target.value }))}
            />
            <Input
              placeholder="Filter properties (comma separated)..."
              value={form.antistring}
              onChange={(e) => setForm((f) => ({ ...f, antistring: e.target.value }))}
            />
          </div>

          {/* Save preset */}
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Preset name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePreset}
              disabled={!saveName.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Bottom row: prompt enhance + model type */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-[15px]">Prompt Enhance</Label>
          <Select
            value={promptEnhance}
            onValueChange={setPromptEnhance}
            options={enhanceOptions}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[15px]">Model Type</Label>
          <Select
            value={modelType}
            onValueChange={setModelType}
            options={modelOptions}
          />
        </div>
      </div>
    </div>
  )
}
