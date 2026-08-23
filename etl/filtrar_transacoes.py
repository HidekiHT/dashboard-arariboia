import csv
import json
import os

def main():
    base_dir = r"c:\Users\hidek\OneDrive\Desktop\API tests"
    bairros_json_path = os.path.join(base_dir, "bairros_niteroi.json")
    transacoes_csv_path = os.path.join(base_dir, "dados_edinheiro", "transacoes.csv")
    output_csv_path = os.path.join(base_dir, "dados_edinheiro", "transacoes_niteroi.csv")

    print("Carregando códigos dos bairros de Niterói...")
    with open(bairros_json_path, 'r', encoding='utf-8') as f:
        bairros_niteroi = json.load(f)

    # Cria um set com os códigos para busca rápida (O(1))
    codigos_niteroi = set(bairro['cod_bairro'] for bairro in bairros_niteroi)
    
    print(f"{len(codigos_niteroi)} bairros carregados.")
    print("Filtrando transacoes.csv (isso pode levar um tempo devido ao tamanho do arquivo)...")

    # Processa o CSV linha a linha para não sobrecarregar a memória
    with open(transacoes_csv_path, 'r', encoding='utf-8') as f_in, \
         open(output_csv_path, 'w', encoding='utf-8', newline='') as f_out:
        
        reader = csv.DictReader(f_in)
        fieldnames = reader.fieldnames
        
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        
        count_total = 0
        count_niteroi = 0
        
        for row in reader:
            count_total += 1
            # Verifica se a origem ou o destino pertencem a Niterói
            if row['cod_bairro_origem'] in codigos_niteroi or row['cod_bairro_destino'] in codigos_niteroi:
                writer.writerow(row)
                count_niteroi += 1
                
            if count_total % 500000 == 0:
                print(f"{count_total} linhas processadas...")

    print("Concluído!")
    print(f"Total de transações analisadas: {count_total}")
    print(f"Total de transações de Niterói salvas: {count_niteroi}")
    print(f"Arquivo salvo em: {output_csv_path}")

if __name__ == "__main__":
    main()
