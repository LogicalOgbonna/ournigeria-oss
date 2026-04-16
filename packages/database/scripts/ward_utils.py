from __future__ import annotations


# canonical mapping from INEC workbook filenames to our state slugs
WORKBOOK_TO_STATE = {
    "ABIA": "abia",
    "ADAMAWA": "adamawa",
    "AKWA-IBOM": "akwa_ibom",
    "ANAMBRA": "anambra",
    "BAUCHI": "bauchi",
    "BAYELSA": "bayelsa",
    "BENUE": "benue",
    "BORNO": "borno",
    "CROSS-RIVER": "cross_river",
    "DELTA": "delta",
    "EBONYI": "ebonyi",
    "EDO": "edo",
    "EKITI": "ekiti",
    "ENUGU": "enugu",
    "FCT": "fct",
    "GOMBE": "gombe",
    "IMO": "imo",
    "JIGAWA": "jigawa",
    "KADUNA": "kaduna",
    "KANO": "kano",
    "KATSINA": "katsina",
    "KEBBI": "kebbi",
    "KOGI": "kogi",
    "KWARA": "kwara",
    "LAGOS": "lagos",
    "NASARAWA": "nasarawa",
    "NIGER": "niger",
    "OGUN": "ogun",
    "ONDO": "ondo",
    "OSUN": "osun",
    "OYO": "oyo",
    "PLATEAU": "plateau",
    "RIVERS": "rivers",
    "SOKOTO": "sokoto",
    "TARABA": "taraba",
    "YOBE": "yobe",
    "ZAMFARA": "zamfara",
}

LGA_NAME_ALIASES = {
    "abia": {"obi ngwa": "obingwa", "osisioma ngwa": "osisioma"},
    "adamawa": {"michika": "michicka"},
    "akwa_ibom": {"esit eket": "esit eket", "essien udim": "essien udim"},
    "bayelsa": {"yenegoa": "yenagoa"},
    "benue": {"markurdi": "makurdi", "oturkpo": "otukpo"},
    "cross_river": {"bakassi": "bakasi", "calabar municipal": "calabar municipality"},
    "delta": {},
    "edo": {"uhunmwonde": "uhunmwode"},
    "ekiti": {"aiyekire (gbonyin)": "aiyekire", "ilejemeji": "ilejemeje"},
    "ebonyi": {"afikpo north": "afikpo", "afikpo south": "afikpo"},
    "fct": {"abuja municipal": "municipal"},
    "gombe": {"shomgom": "shongom"},
    "imo": {
        "ezinihitte": "ezinihitte mbaise",
        "ihitte uboma": "ihitte uboma",
        "ohaji egbema": "ohaji egbema",
        "onuimo": "onuimo",
        "unuimo": "onuimo",
    },
    "jigawa": {"birni kudu": "birnin kudu", "malam madori": "malam maduri"},
    "kaduna": {"markafi": "makarfi", "zango kataf": "zangon kataf"},
    "kano": {
        "garum mallam": "garum malam",
        "nasarawa": "nassarawa",
        "tudun wada": "tundun wada",
    },
    "katsina": {"danmusa": "dan musa"},
    "kebbi": {"arewa dandi": "arewa", "danko wasagu": "wasagu danko"},
    "kogi": {"kogi (k k)": "kogi", "olamabolo": "olamaboro"},
    "lagos": {"shomolu": "somolu"},
    "nasarawa": {"nasarawa": "nassarawa", "nasarawa eggon": "nassarawa eggon"},
    "niger": {"muya": "munya"},
    "ogun": {"shagamu": "sagamu"},
    "osun": {
        "aiyedade": "ayedaade",
        "aiyedire": "ayedire",
        "ilesha east": "ilesa east",
        "ilesha west": "ilesa west",
        "ola oluwa": "olaoluwa",
    },
    "oyo": {
        "atigbo": "atisbo",
        "ogbomosho north": "ogbomoso north",
        "ogbomosho south": "ogbomoso south",
        "oorelope": "orelope",
    },
    "plateau": {"barikin ladi": "barkin ladi", "quaan pan": "quaanpan"},
    "sokoto": {"wamako": "wamakko"},
    "taraba": {},
    "yobe": {"tarmua": "tarmuwa"},
}


def normalize_name(value: str) -> str:
    return " ".join(
        value.strip()
        .lower()
        .replace("&", " and ")
        .replace("/", " ")
        .replace("-", " ")
        .replace("'", "")
        .replace(".", " ")
        .split()
    )


def normalize_lga_name(state: str, value: str) -> str:
    normalized = normalize_name(value)
    return LGA_NAME_ALIASES.get(state, {}).get(normalized, normalized)


def normalize_seed_lga(state: str, lga_code: str) -> str:
    if state == "akwa_ibom":
        base = lga_code.removeprefix("akwa_ibom_")
    elif state == "cross_river":
        base = lga_code.removeprefix("cross_river_")
    else:
        base = lga_code.removeprefix(f"{state}_")

    return normalize_lga_name(state, base.replace("_", " "))


def normalize_official_lga(state: str, value: str) -> str:
    return normalize_lga_name(state, value)
