// Para simular as chamadas à API de login e registro

// Usaremos um Promise para simular a assincronicidade de uma chamada de API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Interface para os dados de login
export interface LoginCredentials {
  email: string;
  senha: string;
}

// Interface para os dados de registro
export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
}

/**
 * Simula uma chamada de API para login.
 * Retorna um token de autenticação em caso de sucesso.
 */
export const mockLogin = async (credentials: LoginCredentials): Promise<{ token: string } | null> => {
  await delay(1000); // Simula um atraso de rede

  // Lógica de mock: um usuário fictício para teste
  if (credentials.email === 'test@example.com' && credentials.senha === 'password123') {
    // Retorna um token fictício
    return { token: 'mock_jwt_token_for_user_test' };
  } else if (credentials.email === 'giovanna@example.com' && credentials.senha === 'minhasenha') {
    return { token: 'mock_jwt_token_for_giovanna' };
  }
  return null; // Credenciais inválidas
};

/**
 * Simula uma chamada de API para registro.
 * Retorna uma mensagem de sucesso ou null em caso de falha.
 */
export const mockRegister = async (data: RegisterData): Promise<{ message: string } | null> => {
  await delay(1000); // Simula um atraso de rede

  // Lógica de mock: sempre sucesso por enquanto
  // Em um cenário real, você verificaria se o email/username já existem
  if (data.email && data.senha && data.nome) {
    return { message: 'Registro realizado com sucesso!' };
  }
  return null; // Dados incompletos
};