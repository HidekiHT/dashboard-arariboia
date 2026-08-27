import csv
import json
import unicodedata
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "dados_edinheiro"
CONFIG_PATH = Path(__file__).with_name("bairros_niteroi_oficiais.json")
DICT_PATH = DATA_DIR / "dicionariov2.csv"
INPUT_PATH = DATA_DIR / "transacoes_bruto.csv"
OUTPUT_PATH = DATA_DIR / "transacoes_bruto_niteroi_oficial.csv"
CODES_PATH = DATA_DIR / "codigos_bairros_niteroi_oficiais.json"


def normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return "".join(char for char in without_accents.upper() if char.isalnum())


def load_official_codes() -> dict[str, str]:
    with CONFIG_PATH.open(encoding="utf-8") as config_file:
        config = json.load(config_file)

    aliases = config["aliases"]

    def canonical(value: str) -> str:
        key = normalize(value)
        return aliases.get(key, key)

    official_names = {canonical(name): name for name in config["bairros"]}
    codes: dict[str, str] = {}

    with DICT_PATH.open(encoding="utf-8", newline="") as dictionary_file:
        for row in csv.DictReader(dictionary_file):
            if normalize(row["nome_cidade"]) != "NITEROI":
                continue

            official_key = canonical(row["nome_bairro"])
            if official_key in official_names:
                codes[row["cod_bairro"].strip()] = official_names[official_key]

    missing = set(official_names) - {canonical(name) for name in codes.values()}
    if missing:
        missing_names = ", ".join(sorted(official_names[name] for name in missing))
        raise ValueError(f"Bairros oficiais sem código correspondente: {missing_names}")

    return codes


def is_official_or_empty(code: str, official_codes: set[str]) -> bool:
    normalized_code = (code or "").strip()
    return not normalized_code or normalized_code in official_codes


def main():
    codes = load_official_codes()
    official_codes = set(codes)
    print(f"{len(official_codes)} códigos oficiais carregados para 52 bairros.")

    with CODES_PATH.open("w", encoding="utf-8") as codes_file:
        json.dump(
            {
                "criterio": "origem e destino precisam ser bairros oficiais de Niterói ou estar vazios",
                "bairros": [{"codigo": code, "bairro": bairro} for code, bairro in sorted(codes.items())],
            },
            codes_file,
            ensure_ascii=False,
            indent=2,
        )

    print("Filtrando transações com origem e destino oficiais (ou vazios)...")
    with INPUT_PATH.open(encoding="utf-8", newline="") as source_file, \
         OUTPUT_PATH.open("w", encoding="utf-8", newline="") as output_file:
        reader = csv.DictReader(source_file)
        writer = csv.DictWriter(output_file, fieldnames=reader.fieldnames)
        writer.writeheader()

        total = 0
        kept = 0
        for row in reader:
            total += 1
            if (
                is_official_or_empty(row["cod_bairro_origem"], official_codes)
                and is_official_or_empty(row["cod_bairro_destino"], official_codes)
            ):
                writer.writerow(row)
                kept += 1

            if total % 500_000 == 0:
                print(f"{total:,} linhas processadas...")

    print("Concluído!")
    print(f"Total analisado: {total:,}")
    print(f"Total salvo: {kept:,}")
    print(f"Arquivo de transações: {OUTPUT_PATH}")
    print(f"Mapa de códigos: {CODES_PATH}")


if __name__ == "__main__":
    main()
