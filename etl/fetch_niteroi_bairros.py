import json, sys, time, io
import subprocess
subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests', '-q'], capture_output=True)
import requests
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# All Niteroi bairros with their OSM Relation IDs (discovered via bbox query)
NITEROI_BAIRROS = {
    8311410: "ICARAI",
    8311446: "SAO FRANCISCO",
    8311460: "INGA",
    8311499: "CENTRO",
    8312996: "BOA VIAGEM",
    8313002: "GRAGOATA",
    8313039: "MORRO DO ESTADO",
    8313126: "SAO DOMINGOS",
    8314333: "CHARITAS",
    8314336: "SANTA ROSA",
    8314337: "VITAL BRASIL",
    8315886: "PE PEQUENO",
    8315931: "FATIMA",
    8315948: "CUBANGO",
    8316249: "CACHOEIRA",
    8316250: "VIRADOURO",
    8316251: "VICOSO JARDIM",
    8316364: "SAO LOURENCO",
    8316658: "LARGO DA BATALHA",
    8316659: "CAFUBA",
    8316660: "MACEIO",
    8316903: "JACARA",
    8316904: "MATAPACA",
    8316905: "SAPE",
    8316906: "BADU",
    8316907: "CARAMUJO",
    8316908: "CANTAGALO",
    8316909: "ENGENHOCA",
    8316910: "SANTANA",
    8316911: "ITITIOCA",
    8316912: "FONSECA",
    8316957: "SERRA GRANDE",
    8316958: "MARAVISTA",
    8316959: "SANTO ANTONIO",
    8316960: "VILA PROGRESSO",
    8316980: "SANTA BARBARA",
    8316981: "BALDEADOR",
    8318087: "JURUJUBA",
    8318128: "JARDIM IMBUI",
    8318527: "VARZEA DAS MOCAS",
    8318528: "ENGENHO DO MATO",
    8318529: "ITACOATIARA",
    8318530: "ITAIPU",
    8318531: "CAMBOINHAS",
    8318532: "PIRATININGA",
    8318728: "ILHA DA CONCEICAO",
    8318729: "PONTA D AREIA",
    8318730: "BARRETO",
    8318731: "TENENTE JARDIM",
    8318732: "MURIQUI",
    8318733: "MARIA PAULA",
    8318734: "RIO DO OURO",
}

# Fetch centroids via Nominatim (batch 50 at a time)
ids_list = list(NITEROI_BAIRROS.keys())
results = {}

# Nominatim allows up to 50 IDs per request
chunk = ids_list[:50]
osm_ids_str = ','.join(f'R{rid}' for rid in chunk)
url = f'https://nominatim.openstreetmap.org/lookup?osm_ids={osm_ids_str}&format=json'

headers = {'User-Agent': 'DashboardArariboia/1.0 (education/research)'}
print(f'Fetching {len(chunk)} centroids from Nominatim...')

r = requests.get(url, headers=headers, timeout=30)
print(f'Status: {r.status_code}')

if r.status_code == 200:
    data = r.json()
    print(f'Got {len(data)} results')
    
    for item in data:
        osm_id = int(item.get('osm_id', 0))
        lat = float(item.get('lat', 0))
        lon = float(item.get('lon', 0))
        display = item.get('display_name', '?').split(',')[0]
        key = NITEROI_BAIRROS.get(osm_id, 'UNKNOWN')
        results[key] = [lat, lon]
        print(f'  {key}: [{lat}, {lon}] ({display})')
    
    # Second chunk
    chunk2 = ids_list[50:]
    if chunk2:
        osm_ids_str2 = ','.join(f'R{rid}' for rid in chunk2)
        url2 = f'https://nominatim.openstreetmap.org/lookup?osm_ids={osm_ids_str2}&format=json'
        time.sleep(1)
        r2 = requests.get(url2, headers=headers, timeout=30)
        if r2.status_code == 200:
            for item in r2.json():
                osm_id = int(item.get('osm_id', 0))
                lat = float(item.get('lat', 0))
                lon = float(item.get('lon', 0))
                key = NITEROI_BAIRROS.get(osm_id, 'UNKNOWN')
                results[key] = [lat, lon]
    
    # Generate TypeScript file
    print(f'\nTotal: {len(results)} centroids found')
    lines = ['export const niteroiCoords: Record<string, [number, number]> = {']
    for key, coords in sorted(results.items()):
        lines.append(f'  "{key}": [{coords[0]}, {coords[1]}],')
    lines.append('};')
    lines.append('')
    lines.append('export function getCoords(bairro: string): [number, number] | null {')
    lines.append('  const normalized = bairro.toUpperCase()')
    lines.append('    .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")')
    lines.append('    .trim();')
    lines.append('  return niteroiCoords[normalized] || null;')
    lines.append('}')
    
    ts_content = '\n'.join(lines)
    with open('src/lib/niteroi-coords.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print('Saved to src/lib/niteroi-coords.ts')
    print(ts_content[:800])
else:
    print(r.text[:300])
