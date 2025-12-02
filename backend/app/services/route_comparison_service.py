from app.clients import google_maps_client
from app.schemas.vehicle_type import VehicleType
from app.clients import myclimate_client

class RouteComparisonService:

    def _extract_polyline(self, poly_obj: dict) -> dict:
        """
        Helper para normalizar a polyline.
        O Google pode mandar 'points' (Directions API) ou 'encodedPolyline' (Routes API).
        O nosso Schema espera 'encodedPolyline'.
        """
        if not poly_obj:
            return {"encodedPolyline": ""}
            
        # Tenta pegar 'encodedPolyline', se não tiver, tenta 'points', se não tiver, vazio.
        points = poly_obj.get("encodedPolyline") or poly_obj.get("points") or ""
        return {"encodedPolyline": points}
        
    def calculate_bus_route_emissions(self, origin: str, destination: str) -> list:
        """
         Calculation of emissions for multiple bus routes.
        """
        
        # Buscar rotas na API do Google
        google_response = google_maps_client.find_bus_routes(origin, destination)
        
        unique_routes_map = {}
        
        if "routes" not in google_response:
            return [] 

        calculated_routes = []

        # Iterar sobre cada rota alternativa que o Google retornou
        for route in google_response.get("routes", []):
            total_bus_distance_meters = 0
            line_names = [] # Para descrever a rota
            segments = [] # Lista para guardar os pedaços da rota
            
            # Somar a distância dos trechos 
            for leg in route.get("legs", []):
                for step in leg.get("steps", []):
                        
                    step_distance_meters = step.get("distanceMeters", 0)
                    step_distance_km = step_distance_meters / 1000.0
                    step_polyline = step.get("polyline", {"encodedPolyline": ""})
                    instruction = step.get("navigationInstruction", {}).get("instructions", "")
                    travel_mode = step.get("travelMode")
 
                    segment_data = {
                        "distance_km": round(step_distance_km, 3),
                        "polyline": step_polyline,
                        "instruction": instruction,
                        "line_name": None,
                        "line_color": None,
                        "vehicle_type": None
                    }
                    
                    
                    # --- Lógica para TRANSIT (Ônibus/Metrô) ---
                    if travel_mode == "TRANSIT":
                        total_bus_distance_meters += step_distance_meters
                        
                        transit_details = step.get("transitDetails", {})
                        transit_line = transit_details.get("transitLine", {})
 
                        line_name = transit_line.get("nameShort")
                        if line_name:
                            line_names.append(line_name)
                        
                        segment_data["type"] = "BUS"
                        segment_data["line_name"] = line_name
                        segment_data["line_color"] = transit_line.get("color") 
                        segment_data["vehicle_type"] = transit_line.get("vehicle", {}).get("name", {}).get("text", "BUS")
                        
                        headsign = transit_details.get("headsign")
                        if not instruction:
                            segment_data["instruction"] = f"Pegue {line_name} sentido {headsign}"

                    # --- Lógica para WALKING (Caminhada) ---
                    elif travel_mode == "WALK":
                        segment_data["type"] = "WALK"
                        if not instruction:
                            segment_data["instruction"] = "Caminhe"
                    
                    # --- Outros---
                    else:
                        segment_data["type"] = "OTHER"

                    segments.append(segment_data)


            if total_bus_distance_meters == 0:
                continue

            distance_km = total_bus_distance_meters / 1000.0
            
            unique_lines = sorted(list(set(line_names)))
            
            if not unique_lines:
                continue
            
            route_signature = tuple(unique_lines)
            
            if route_signature in unique_routes_map:
                            continue
            
            ordered_lines_display = list(dict.fromkeys(line_names))
            
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
            
            route_obj = {
                "description": f"Rota via {', '.join(ordered_lines_display)}", # ex: Rota via 8000-10, 8022-10
                "distance_km": round(distance_km, 2),
                "emission_kg_co2": round(emission_kg, 2),
                "polyline": polyline_data,
                "segments": segments 
            }
            
            unique_routes_map[route_signature] = route_obj
        #Ordenar a lista da menor emissão para a maior
        calculated_routes = list(unique_routes_map.values())
        
        sorted_routes = sorted(calculated_routes, key=lambda x: x["emission_kg_co2"])
        
        return sorted_routes


