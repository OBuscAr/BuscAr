from app.repositories import google_maps_client
from app.schemas.vehicle_type import VehicleType
from app.repositories import myclimate_client
class RouteComparisonService:
    
    def calculate_bus_route_emissions(self, origin: str, destination: str) -> list:
        """
         Calculation of emissions for multiple bus routes.
        """
        
        # Buscar rotas na API do Google
        google_response = google_maps_client.find_bus_routes(origin, destination)

        if "routes" not in google_response:
            return [] 

        calculated_routes = []

        # Iterar sobre cada rota alternativa que o Google retornou
        for route in google_response.get("routes", []):
            total_bus_distance_meters = 0
            line_names = [] # Para descrever a rota

            # Somar APENAS a distância dos trechos de ônibus
            for leg in route.get("legs", []):
                for step in leg.get("steps", []):
                    # Verificar se o "passo" é de transporte público
                    if step.get("travelMode") == "TRANSIT":
                        total_bus_distance_meters += step.get("distanceMeters", 0)
                        
                        print("DEBUG transitDetails:", step.get("transitDetails"))
                        # Coleta o nome da linha 
                        line_name = step.get("transitDetails", {}).get("transitLine", {}).get("nameShort")
                        if line_name:
                            line_names.append(line_name)

            if total_bus_distance_meters == 0:
                continue

            distance_km = total_bus_distance_meters / 1000.0
            
            # Calcular a emissão de carbono com o MyClimate
            try:
                emission_kg = myclimate_client.calculate_carbon_emission(
                    distance=distance_km,
                    vehicle_type=VehicleType.BUS
                )
            except Exception as e:
                # Indica falha
                emission_kg = -1 
                
            polyline_data = route.get("polyline", {"encodedPolyline": ""})
            
            calculated_routes.append({
                "description": f"Rota via {', '.join(list(set(line_names)))}", # ex: Rota via 8000-10, 8022-10
                "distance_km": round(distance_km, 2),
                "emission_kg_co2": round(emission_kg, 2),
                "polyline": polyline_data
            })

        #Ordenar a lista da menor emissão para a maior
        sorted_routes = sorted(calculated_routes, key=lambda x: x["emission_kg_co2"])
        
        return sorted_routes
