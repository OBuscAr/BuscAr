import sys
from pprint import pprint
from requests.exceptions import HTTPError
from app.services.route_comparison_service import RouteComparisonService
from app.core.config import settings
from app.clients import google_maps_client 

# Ajustar depois
sys.path.append('./') 

# Endereços de testes
ORIGEM_ENDERECO = "Avenida Paulista, 1578, São Paulo, SP" 
DESTINO_ENDERECO = "Avenida Pedro Álvares Cabral, Portão 3, São Paulo, SP" 

def run_real_test():
    print(f"--- Iniciando Teste End-to-End para 'BuscAr' ---")
    
    # Verificar se as chaves foram carregadas
    if not settings.GOOGLE_API_KEY or "AIzaSy" not in settings.GOOGLE_API_KEY:
        print("ERRO: GOOGLE_API_KEY não encontrada ou inválida no .env")
        return

    if not settings.MYCLIMATE_USERNAME:
        print("ERRO: MYCLIMATE_USERNAME não encontrado no .env")
        return
        
    print(f"Origem: {ORIGEM_ENDERECO}")
    print(f"Destino: {DESTINO_ENDERECO}\n")
    print("...Conectando ao Google Routes API...")


    service = RouteComparisonService()

    try:
        routes = service.calculate_bus_route_emissions(
            origin=ORIGEM_ENDERECO,
            destination=DESTINO_ENDERECO
        )
        
        print("\n--- SUCESSO! Resposta recebida: ---")
        if not routes:
            print("\nNenhuma rota *apenas de ônibus* foi encontrada pelo Google.")
        else:
            print(routes) # JSON
            
            print("\n--- Teste Concluído ---")
            print(f"Encontradas {len(routes)} rotas.")
            print(f"Menor emissão (primeira da lista): {routes[0]['emission_kg_co2']} kg CO2")

    except HTTPError as e:
        print("\n--- ERRO NA CHAMADA DA API ---")
        print(f"Status Code: {e.response.status_code}")
        print(f"URL: {e.request.url}")
        
        # Isso é MUITO útil para debugar erros do Google
        print(f"Resposta da API: {e.response.json()}") 
        
        if e.response.status_code == 403:
            print("\nPossível Causa (Erro 403):")
            print("1. Sua GOOGLE_API_KEY é inválida.")
            print("2. A 'Routes API' não está ATIVADA no seu projeto Google Cloud.")
            print("3. O 'Billing' (Faturamento) não está configurado no seu projeto.")

    except Exception as e:
        print(f"\n--- ERRO INESPERADO ---")
        print(f"Tipo: {type(e).__name__}")
        print(f"Mensagem: {e}")

if __name__ == "__main__":
    run_real_test()
