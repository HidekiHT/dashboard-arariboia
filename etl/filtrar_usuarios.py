import pandas as pd
import json
import unicodedata
import os

def normalize_string(s):
    if pd.isna(s) or not isinstance(s, str):
        return ""
    # Remove accents and convert to uppercase to ensure perfect matching
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if unicodedata.category(c) != 'Mn')
    return s.strip().upper()

def process():
    base_dir = r"c:\Users\hidek\OneDrive\Desktop\API tests\dados_edinheiro"
    
    dict_path = os.path.join(base_dir, "dicionariov2.csv")
    users_path = os.path.join(base_dir, "usuarios.json")
    users_out_path = os.path.join(base_dir, "usuarios_niteroi.json")

    print("Carregando dicionário...")
    df_dict = pd.read_csv(dict_path)
    
    # Filtrar dicionário para cidade = Niterói
    df_dict['cidade_norm'] = df_dict['nome_cidade'].apply(normalize_string)
    df_niteroi = df_dict[df_dict['cidade_norm'] == 'NITEROI']
    
    bairros_niteroi = set(df_niteroi['nome_bairro'].apply(normalize_string))
    
    print(f"Encontrados {len(bairros_niteroi)} nomes de bairros para Niterói no dicionariov2.")
    
    print("Processando usuários...")
    with open(users_path, 'r', encoding='utf-8') as f:
        usuarios = json.load(f)
        
    usuarios_niteroi = []
    for u in usuarios:
        bairro_norm = normalize_string(u.get('bairro', ''))
        # Se o nome normalizado do bairro bater com os do dicionário
        if bairro_norm in bairros_niteroi:
            usuarios_niteroi.append(u)
            
    with open(users_out_path, 'w', encoding='utf-8') as f:
        json.dump(usuarios_niteroi, f, ensure_ascii=False, indent=2)
        
    print(f"Total de {len(usuarios_niteroi)} usuários salvos em: {users_out_path}")

if __name__ == "__main__":
    process()
