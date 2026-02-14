from fastapi import APIRouter, HTTPException

from random_prompt.build_dynamic_prompt import build_dynamic_prompt
from random_prompt.one_button_presets import OneButtonPresets
from random_prompt.csv_reader import load_config_csv
from api.schemas import OBPGenerateRequest, OBPPresetSave

router = APIRouter()

# Shared preset manager instance
_obp = OneButtonPresets()


def _build_subject_lists():
    """Build the subject/subtype lists from config, matching ui_onebutton.py logic."""
    config = load_config_csv()

    # Parse config into booleans
    flags = {}
    for item in config:
        flags[item[0]] = item[1] == "on"

    subjects = ["all"]
    subtype_object = ["all"]
    subtype_humanoid = ["all"]
    subtype_concept = ["all"]

    # Objects
    gen_vehicle = flags.get("subject_vehicle", True)
    gen_object = flags.get("subject_object", True)
    gen_food = flags.get("subject_food", True)
    gen_building = flags.get("subject_building", True)
    gen_space = flags.get("subject_space", True)
    gen_flora = flags.get("subject_flora", True)

    if any([gen_vehicle, gen_object, gen_food, gen_building, gen_space, gen_flora]):
        subjects.append("--- object - all")
        if gen_object:
            subjects.append("object - generic")
            subtype_object.append("generic objects")
        if gen_vehicle:
            subjects.append("object - vehicle")
            subtype_object.append("vehicles")
        if gen_food:
            subjects.append("object - food")
            subtype_object.append("food")
        if gen_building:
            subjects.append("object - building")
            subtype_object.append("buildings")
        if gen_space:
            subjects.append("object - space")
            subtype_object.append("space")
        if gen_flora:
            subjects.append("object - flora")
            subtype_object.append("flora")

    # Animals
    gen_animal = flags.get("subject_animal", True)
    gen_bird = flags.get("subject_bird", True)
    gen_cat = flags.get("subject_cat", True)
    gen_dog = flags.get("subject_dog", True)
    gen_insect = flags.get("subject_insect", True)
    gen_pokemon = flags.get("subject_pokemon", True)
    gen_marine = flags.get("subject_marinelife", True)

    if any([gen_animal, gen_bird, gen_cat, gen_dog, gen_insect, gen_pokemon, gen_marine]):
        subjects.append("--- animal - all")
        if gen_animal:
            subjects.append("animal - generic")
        if gen_bird:
            subjects.append("animal - bird")
        if gen_cat:
            subjects.append("animal - cat")
        if gen_dog:
            subjects.append("animal - dog")
        if gen_insect:
            subjects.append("animal - insect")
        if gen_marine:
            subjects.append("animal - marine life")
        if gen_pokemon:
            subjects.append("animal - pokémon")

    # Humans
    gen_manwoman = flags.get("subject_manwoman", True)
    gen_relation = flags.get("subject_manwomanrelation", True)
    gen_nonfictional = flags.get("subject_nonfictional", True)
    gen_fictional = flags.get("subject_fictional", True)
    gen_humanoids = flags.get("subject_humanoid", True)
    gen_job = flags.get("subject_job", True)
    gen_firstnames = flags.get("subject_firstnames", True)
    gen_multiple = flags.get("subject_manwomanmultiple", True)

    if any([gen_manwoman, gen_relation, gen_nonfictional, gen_fictional, gen_humanoids, gen_job, gen_multiple]):
        subjects.append("--- human - all")
        if gen_manwoman:
            subjects.append("human - generic")
            subtype_humanoid.append("generic humans")
        if gen_relation:
            subjects.append("human - relations")
            subtype_humanoid.append("generic human relations")
        if gen_nonfictional:
            subjects.append("human - celebrity")
            subtype_humanoid.append("celebrities e.a.")
        if gen_fictional:
            subjects.append("human - fictional")
            subtype_humanoid.append("fictional characters")
        if gen_humanoids:
            subjects.append("human - humanoids")
            subtype_humanoid.append("humanoids")
        if gen_job:
            subjects.append("human - job/title")
            subtype_humanoid.append("based on job or title")
        if gen_firstnames:
            subjects.append("human - first name")
            subtype_humanoid.append("based on first name")
        if gen_multiple:
            subjects.append("human - multiple")
            subtype_humanoid.append("multiple humans")

    # Landscapes
    gen_location = flags.get("subject_location", True)
    gen_loc_fantasy = flags.get("subject_location_fantasy", True)
    gen_loc_scifi = flags.get("subject_location_scifi", True)
    gen_loc_videogame = flags.get("subject_location_videogame", True)
    gen_loc_biome = flags.get("subject_location_biome", True)
    gen_loc_city = flags.get("subject_location_city", True)

    if any([gen_location, gen_loc_fantasy, gen_loc_scifi, gen_loc_videogame, gen_loc_biome, gen_loc_city]):
        subjects.append("--- landscape - all")
        if gen_location:
            subjects.append("landscape - generic")
        if gen_loc_fantasy:
            subjects.append("landscape - fantasy")
        if gen_loc_scifi:
            subjects.append("landscape - sci-fi")
        if gen_loc_videogame:
            subjects.append("landscape - videogame")
        if gen_loc_biome:
            subjects.append("landscape - biome")
        if gen_loc_city:
            subjects.append("landscape - city")

    # Concepts
    gen_event = flags.get("subject_event", True)
    gen_concepts = flags.get("subject_concept", True)
    gen_poem = flags.get("poemline", True)
    gen_song = flags.get("songline", True)
    gen_card = flags.get("subject_cardname", True)
    gen_episode = flags.get("subject_episodetitle", True)
    gen_mixer = flags.get("subject_conceptmixer", True)

    if any([gen_event, gen_concepts, gen_poem, gen_song, gen_card, gen_episode, gen_mixer]):
        subjects.append("--- concept - all")
        if gen_event:
            subjects.append("concept - event")
            subtype_concept.append("event")
        if gen_concepts:
            subjects.append("concept - the x of y")
            subtype_concept.append("the X of Y concepts")
        if gen_poem:
            subjects.append("concept - poem lines")
            subtype_concept.append("lines from poems")
        if gen_song:
            subjects.append("concept - song lines")
            subtype_concept.append("lines from songs")
        if gen_card:
            subjects.append("concept - card names")
            subtype_concept.append("names from card based games")
        if gen_episode:
            subjects.append("concept - episode titles")
            subtype_concept.append("episode titles from tv shows")
        if gen_mixer:
            subjects.append("concept - mixer")
            subtype_concept.append("concept mixer")

    return subjects, subtype_object, subtype_humanoid, subtype_concept


# Static lists (matching ui_onebutton.py)
ARTISTS = [
    "all", "all (wild)", "none", "popular", "greg mode", "3D",
    "abstract", "angular", "anime", "architecture", "art nouveau", "art deco",
    "baroque", "bauhaus", "cartoon", "character", "children's illustration",
    "cityscape", "clean", "cloudscape", "collage", "colorful", "comics",
    "cubism", "dark", "detailed", "digital", "expressionism", "fantasy",
    "fashion", "fauvism", "figurativism", "gore", "graffiti", "graphic design",
    "high contrast", "horror", "impressionism", "installation", "landscape",
    "light", "line drawing", "low contrast", "luminism", "magical realism",
    "manga", "melanin", "messy", "monochromatic", "nature", "nudity",
    "photography", "pop art", "portrait", "primitivism", "psychedelic",
    "realism", "renaissance", "romanticism", "scene", "sci-fi", "sculpture",
    "seascape", "space", "stained glass", "still life", "storybook realism",
    "street art", "streetscape", "surrealism", "symbolism", "textile",
    "ukiyo-e", "vibrant", "watercolor", "whimsical",
]

IMAGE_TYPES = [
    "all", "all - force multiple", "all - anime", "none",
    "photograph", "octane render", "digital art", "concept art",
    "painting", "portrait", "anime", "only other types",
    "only templates mode", "dynamic templates mode", "art blaster mode",
    "quality vomit mode", "color cannon mode", "unique art mode",
    "massive madness mode", "photo fantasy mode", "subject only mode",
    "fixed styles mode", "the tokinator",
]

GENDERS = ["all", "male", "female"]
MODEL_TYPES = ["SDXL", "Anime Model"]
PROMPT_ENHANCE = ["none", "hyperprompt", "llama"]


@router.get("/obp/options")
async def get_obp_options():
    """Return all dropdown options for the One Button Prompt UI."""
    subjects, subtype_object, subtype_humanoid, subtype_concept = _build_subject_lists()

    presets = _obp.load_obp_presets()
    preset_names = [_obp.RANDOM_PRESET_OBP] + list(presets.keys()) + [_obp.CUSTOM_OBP]

    return {
        "subjects": subjects,
        "artists": ARTISTS,
        "imagetypes": IMAGE_TYPES,
        "genders": GENDERS,
        "model_types": MODEL_TYPES,
        "prompt_enhance": PROMPT_ENHANCE,
        "subtype_object": subtype_object,
        "subtype_humanoid": subtype_humanoid,
        "subtype_concept": subtype_concept,
        "preset_names": preset_names,
        "presets": {k: v for k, v in presets.items()},
    }


@router.post("/obp/generate")
async def generate_prompt(req: OBPGenerateRequest):
    """Generate a random prompt using One Button Prompt."""
    prompt = build_dynamic_prompt(
        insanitylevel=req.insanitylevel,
        forcesubject=req.subject,
        artists=req.artist,
        imagetype=req.imagetype,
        onlyartists=False,
        antivalues=req.antistring,
        prefixprompt=req.prefixprompt,
        suffixprompt=req.suffixprompt,
        promptcompounderlevel=1,
        seperator="comma",
        givensubject=req.givensubject,
        smartsubject=req.smartsubject,
        giventypeofimage=req.giventypeofimage,
        imagemodechance=req.imagemodechance,
        gender=req.chosengender,
        subtypeobject=req.chosensubjectsubtypeobject,
        subtypehumanoid=req.chosensubjectsubtypehumanoid,
        subtypeconcept=req.chosensubjectsubtypeconcept,
        advancedprompting=False,
        hardturnoffemojis=False,
        seed=0,
        overrideoutfit=req.givenoutfit,
        prompt_g_and_l=False,
        base_model=req.modeltype,
        OBP_preset=req.obp_preset,
        prompt_enhancer=req.promptenhance,
    )
    return {"prompt": prompt}


@router.get("/obp/presets")
async def get_presets():
    """Return all OBP presets."""
    presets = _obp.load_obp_presets()
    return {
        "preset_names": [_obp.RANDOM_PRESET_OBP] + list(presets.keys()) + [_obp.CUSTOM_OBP],
        "presets": presets,
    }


@router.post("/obp/presets")
async def save_preset(req: OBPPresetSave):
    """Save or update an OBP preset."""
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Preset name is required")

    presets = _obp.load_obp_presets()
    presets[req.name] = {
        "insanitylevel": req.insanitylevel,
        "subject": req.subject,
        "artist": req.artist,
        "chosensubjectsubtypeobject": req.chosensubjectsubtypeobject,
        "chosensubjectsubtypehumanoid": req.chosensubjectsubtypehumanoid,
        "chosensubjectsubtypeconcept": req.chosensubjectsubtypeconcept,
        "chosengender": req.chosengender,
        "imagetype": req.imagetype,
        "imagemodechance": req.imagemodechance,
        "givensubject": req.givensubject,
        "smartsubject": req.smartsubject,
        "givenoutfit": req.givenoutfit,
        "prefixprompt": req.prefixprompt,
        "suffixprompt": req.suffixprompt,
        "giventypeofimage": req.giventypeofimage,
        "antistring": req.antistring,
    }
    _obp.save_obp_preset(presets)

    return {
        "status": "saved",
        "preset_names": [_obp.RANDOM_PRESET_OBP] + list(presets.keys()) + [_obp.CUSTOM_OBP],
    }
