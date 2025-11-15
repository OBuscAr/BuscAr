import os
from dotenv import load_dotenv
from pathlib import Path
from requests.auth import HTTPBasicAuth
import requests

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

MYCLIMATE_USERNAME = os.getenv("MYCLIMATE_API_USER")
MYCLIMATE_PASSWORD = os.getenv("MYCLIMATE_API_PASSWORD")
MYCLIMATE_URL = "https://api.myclimate.org/v1/car_calculators.json"

CONSUMO_MEDIO_ONIBUS_L_100KM = 45.0 
TIPO_COMBUSTIVEL_ONIBUS = "diesel"

distancia_km = 8.19  

def calcular_emissoes(km_percorridos: float):
    """Uses the myclimate API to calculate emissions for a route."""
    
    if not MYCLIMATE_USERNAME or not MYCLIMATE_PASSWORD:
        print("ERRO: Credenciais MYCLIMATE_API_USER ou MYCLIMATE_API_PASSWORD não encontradas no .env")
        return None

    payload = {
        "fuel_type": TIPO_COMBUSTIVEL_ONIBUS,
        "km": km_percorridos,
        "fuel_consumption": CONSUMO_MEDIO_ONIBUS_L_100KM
    }
    
    auth = HTTPBasicAuth(MYCLIMATE_USERNAME, MYCLIMATE_PASSWORD)
    
    print(f"Enviando {km_percorridos:.2f} km para a API myclimate...")
    
    try:
        response = requests.post(MYCLIMATE_URL, json=payload, auth=auth)
        response.raise_for_status() 
        data = response.json()
        
        if "kg" in data:
            return data["kg"]
        else:
            print(f"Resposta da myclimate não continha a chave 'kg': {data}")
            return None
        
    except requests.exceptions.RequestException as e:
        print(f"Erro ao chamar a API myclimate: {e}")
        return None

if __name__ == "__main__":
    
    kg_co2 = calcular_emissoes(distancia_km)
    
    if kg_co2:
        print("\n--- ✅ TAREFA CONCLUÍDA (Cálculo de Emissão) ---")
        print(f"Distância: {distancia_km:.2f} km")
        print(f"Emissão Estimada: {kg_co2:.2f} kg de CO2")
    else:
        print("\n--- ⛔ FALHA NO CÁLCULO DE EMISSÃO ---")
        print("Verifique suas credenciais da myclimate no .env")
