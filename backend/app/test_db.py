import sys
import os

# Adiciona o diretório raiz ao path do Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.core.database import SessionLocal, engine
    from sqlalchemy import text  # Importação importante para SQLAlchemy 2.0!
    
    print("Módulos importados com sucesso de app.core.database!")
    
    def test_database_connection():
        try:
            # Testa a conexão criando uma sessão
            db = SessionLocal()
            
            # Executa um comando simples para testar a conexão
            if hasattr(engine, 'dialect'):
                # Para SQLAlchemy
                db.execute(text("SELECT 1"))
                print("Conexão com o banco de dados estabelecida com sucesso!")
            else:
                # Para outros drivers
                print(" Sessão do banco criada com sucesso!")
            
            db.close()
            return True
            
        except Exception as e:
            print(f" Erro na conexão com o banco: {e}")
            return False

except ImportError as e:
    print(f"  Erro na importação: {e}")
    print("   Estrutura de diretórios esperada:")
    print("   backend/app/core/database.py")
    print("   backend/app/test_db.py")

if __name__ == "__main__":
    test_database_connection()
