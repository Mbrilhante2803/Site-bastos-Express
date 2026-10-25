function sys = identificar_1a_ordem(A, y0, y_final, metodo, varargin)
% IDENTIFICAR_1A_ORDEM System Identification for 1st Order Systems with Delay
%
% Sintaxe:
%   sys = identificar_1a_ordem(A, y0, y_final, '63', t_63, t_atraso)
%   sys = identificar_1a_ordem(A, y0, y_final, 'smith', t_28, t_63)
%   sys = identificar_1a_ordem(A, y0, y_final, 'sundaresan', t_35, t_85)
%
% Entradas:
%   A        - Amplitude da variação do degrau de entrada (\Delta u)
%   y0       - Valor inicial da saída antes do degrau
%   y_final  - Valor final da saída em regime permanente
%   metodo   - Método de identificação: '63', 'smith' ou 'sundaresan'
%   varargin - Tempos medidos na resposta ao degrau conforme o método escolhido
%
% Saída:
%   sys - Estrutura contendo:
%         sys.K     : Ganho estático
%         sys.tau   : Constante de tempo
%         sys.theta : Tempo morto (atraso de transporte)
%         sys.tf    : Objeto de Função de Transferência (se control toolbox disponível)
%         sys.str_tf: Representação em string da Função de Transferência

    % Validação de entrada
    if A == 0
        error('A amplitude do degrau de entrada (A) não pode ser zero.');
    end

    % Calculo do ganho estático K
    delta_y = y_final - y0;
    K = delta_y / A;

    tau = 0;
    theta = 0;

    switch lower(metodo)
        case '63'
            % Método dos 63.2%
            % Entrada extra: t_63 (tempo onde a resposta atinge 63.2% da variação total)
            % e opcionalmente t_atraso (tempo em que a resposta começa a responder)
            if length(varargin) < 1
                error('Para o método 63, informe t_63 (e opcionalmente t_atraso).');
            end
            t_63 = varargin{1};
            if length(varargin) >= 2
                theta = varargin{2};
            else
                theta = 0;
            end
            tau = t_63 - theta;
            if tau <= 0
                error('Constante de tempo tau calculada é menor ou igual a zero. Verifique os tempos informados.');
            end

        case 'smith'
            % Método de 2 pontos de Smith (28.3% e 63.2%)
            % Entradas: t_28 (tempo para 28.3% da variação) e t_63 (tempo para 63.2% da variação)
            if length(varargin) < 2
                error('Para o método de Smith, informe t_28 e t_63.');
            end
            t_28 = varargin{1};
            t_63 = varargin{2};

            tau = 1.5 * (t_63 - t_28);
            theta = t_63 - tau;
            if theta < 0
                theta = 0;
            end

        case 'sundaresan'
            % Método de Sundaresan e Krishnaswamy (35.3% e 85.3%)
            % Entradas: t_35 (tempo para 35.3%) e t_85 (tempo para 85.3%)
            if length(varargin) < 2
                error('Para o método de Sundaresan, informe t_35 e t_85.');
            end
            t_35 = varargin{1};
            t_85 = varargin{2};

            tau = 0.67 * (t_85 - t_35);
            theta = 1.3 * t_35 - 0.29 * t_85;
            if theta < 0
                theta = 0;
            end

        otherwise
            error('Método desconhecido. Escolha entre ''63'', ''smith'' ou ''sundaresan''.');
    end

    % Montar estrutura do resultado
    sys.ordem = 1;
    sys.K = K;
    sys.tau = tau;
    sys.theta = theta;

    % String representativa
    if theta > 0
        sys.str_tf = sprintf('G(s) = (%.4f / (%.4f*s + 1)) * exp(-%.4f*s)', K, tau, theta);
    else
        sys.str_tf = sprintf('G(s) = %.4f / (%.4f*s + 1)', K, tau);
    end

    % Tentar criar objeto tf se a toolbox Control System estiver instalada
    try
        sys.tf = tf(K, [tau 1], 'InputDelay', theta);
    catch
        sys.tf = [];
    end

    % Exibir informações na tela
    fprintf('\n=== Identificação do Sistema de 1ª Ordem ===\n');
    fprintf('Ganho estático (K): %.4f\n', K);
    fprintf('Constante de tempo (tau): %.4f s\n', tau);
    fprintf('Atraso de transporte (theta): %.4f s\n', theta);
    fprintf('Função de Transferência: %s\n\n', sys.str_tf);
end
