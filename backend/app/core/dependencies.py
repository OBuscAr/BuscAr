import requests
from fastapi import HTTPException, Depends
from requests.cookies import RequestsCookieJar
from app.repositories import sptrans_client 

def get_sptrans_cookies() -> RequestsCookieJar:
    """
    Dependency that logs into SPTrans API and yields the cookies.
    Handles login errors automatically.
    """
    try:
        cookies = sptrans_client.login()
        yield cookies
    except requests.exceptions.RequestException as e:
        print(f"Erro ao autenticar na SPTrans: {e}")
        raise HTTPException(status_code=503, detail="Não foi possível autenticar no serviço SPTrans.")
