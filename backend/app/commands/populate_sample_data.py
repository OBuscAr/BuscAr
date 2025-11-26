"""
Script para popular o banco de dados com dados de exemplo para testes.
"""
import random
from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models.line import Line, LineDirection
from app.models.daily_line_statistics import DailyLineStatistics
from app.models.stop import Stop


def create_sample_lines(session):
    """Criar linhas de exemplo"""
    lines_data = [
        (1, "874C-10 - TERM. PARQUE D. PEDRO II - VILA GUILHERME", LineDirection.MAIN),
        (2, "874C-10 - VILA GUILHERME - TERM. PARQUE D. PEDRO II", LineDirection.SECONDARY),
        (3, "8705-10 - TERM. BANDEIRA - COHAB BARRO BRANCO", LineDirection.MAIN),
        (4, "8705-10 - COHAB BARRO BRANCO - TERM. BANDEIRA", LineDirection.SECONDARY),
        (5, "8319-10 - TERM. PIRITUBA - CENTRO", LineDirection.MAIN),
        (6, "8319-10 - CENTRO - TERM. PIRITUBA", LineDirection.SECONDARY),
        (7, "715M-10 - JD. SARAH - METRÔ SANTANA", LineDirection.MAIN),
        (8, "715M-10 - METRÔ SANTANA - JD. SARAH", LineDirection.SECONDARY),
        (9, "875C-10 - TERM. GRAJAÚ - METRÔ CONCEIÇÃO", LineDirection.MAIN),
        (10, "875C-10 - METRÔ CONCEIÇÃO - TERM. GRAJAÚ", LineDirection.SECONDARY),
    ]
    
    lines = []
    for line_id, name, direction in lines_data:
        existing = session.query(Line).filter_by(id=line_id).first()
        if not existing:
            line = Line(id=line_id, name=name, direction=direction)
            session.add(line)
            lines.append(line)
        else:
            lines.append(existing)

    session.commit()
    print(f"✅ {len(lines)} linhas criadas/verificadas")
    return lines


def create_sample_statistics(session, lines, days=30):
    """Criar estatísticas diárias de exemplo"""
    today = datetime.now().date()
    statistics = []

    for day_offset in range(days):
        date = today - timedelta(days=day_offset)
        
        for line in lines:
            # Gerar distância percorrida aleatória entre 200 e 500 km
            distance_traveled = random.uniform(200, 500)
            
            stat = DailyLineStatistics(
                line_id=line.id,
                date=date,
                distance_traveled=distance_traveled,
            )
            statistics.append(stat)

    # Remover estatísticas existentes para evitar duplicatas
    session.query(DailyLineStatistics).delete()
    session.commit()

    session.add_all(statistics)
    session.commit()
    print(f"✅ {len(statistics)} estatísticas criadas ({days} dias × {len(lines)} linhas)")


def create_sample_stops(session):
    """Criar paradas de exemplo"""
    stops = [
        Stop(
            id=1,
            name="Terminal Parque Dom Pedro II",
            address="Av. do Estado",
            latitude=-23.544722,
            longitude=-46.627778,
        ),
        Stop(
            id=2,
            name="Praça da Sé",
            address="Praça da Sé",
            latitude=-23.550520,
            longitude=-46.634233,
        ),
        Stop(
            id=3,
            name="Terminal Bandeira",
            address="Largo do Paissandu",
            latitude=-23.544444,
            longitude=-46.637222,
        ),
    ]

    for stop in stops:
        existing = session.query(Stop).filter_by(id=stop.id).first()
        if not existing:
            session.add(stop)

    session.commit()
    print(f"✅ {len(stops)} paradas criadas/verificadas")


def main():
    """Executar população de dados de exemplo"""
    print("🚀 Iniciando população de dados de exemplo...")
    
    session = SessionLocal()
    
    try:
        # Criar linhas
        lines = create_sample_lines(session)
        
        # Criar estatísticas
        create_sample_statistics(session, lines, days=90)
        
        # Criar paradas
        create_sample_stops(session)
        
        print("\n✨ Dados de exemplo criados com sucesso!")
        print("📊 O dashboard agora deve exibir estatísticas.")
        
    except Exception as e:
        print(f"\n❌ Erro ao popular dados: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
