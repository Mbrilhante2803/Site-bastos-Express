function sys = identificar_2a_ordem(A, y0, y_final, tipo, varargin)
% IDENTIFICAR_2A_ORDEM System Identification for 2nd Order Systems
%
% Sintaxe:
%   % Caso subamortecido (com sobresinal / Mp > 0):
%   sys = identificar_2a_ordem(A, y0, y_final, 'sub', y_pico, t_pico)
%   sys = identificar_2a_ordem(A, y0, y_final, 'sub', y_pico, t_pico, t_atraso)
%
%   % Caso superamortecido / overdamped (sem sobresinal):
%   sys = identificar_2a_ordem(A, y0, y_final, 'super', t_20, t_60)
%
% Entradas:
%   A        - Amplitude do degrau de entrada (\Delta u)
%   y0       - Valor inicial da saída antes do degrau
%   y_final  - Valor final em regime permanente
%   tipo     - 'sub' (subamortecido) ou 'super' (superamortecido)
%   varargin - Parâmetros medidos na resposta ao degrau
%
% Saída:
%   sys - Estrutura contendo:
%         sys.K       : Ganho estático
%         sys.zeta    : Fator de amortecimento (\zeta)
%         sys.wn      : Frequência natural não amortecida (\omega_n)
%         sys.wd      : Frequência natural amortecida (\omega_d)
%         sys.Mp      : Sobresinal relativo (para subamortecido)
%         sys.theta   : Tempo morto / atraso de transporte
%         sys.str_tf  : Representação em string da Função de Transferência
%         sys.tf      : Objeto tf (se disponível)

    if A == 0
        error('A amplitude do degrau de entrada (A) não pode ser zero.');
    end

    delta_y = y_final - y0;
    K = delta_y / A;
    theta = 0;

    switch lower(tipo)
        case 'sub'
            % Sistema Subamortecido (0 < zeta < 1)
            % Entradas: y_pico (valor máximo atingido), t_pico (tempo do valor máximo)
            % Opcional: t_atraso (tempo morto)
            if length(varargin) < 2
                error('Para o caso subamortecido, informe y_pico e t_pico.');
            end
            y_pico = varargin{1};
            t_pico = varargin{2};
            if length(varargin) >= 3
                theta = varargin{3};
            end

            t_pico_efetivo = t_pico - theta;
            if t_pico_efetivo <= 0
                error('O tempo de pico deve ser maior que o tempo de atraso.');
            end

            % Cálculo do sobresinal Mp (em porcentagem e fração)
            Mp_abs = y_pico - y_final;
            Mp = Mp_abs / delta_y;

            if Mp <= 0
                error('Para resposta subamortecida, o valor de pico deve ser maior que o valor final em regime.');
            end

            % Fator de amortecimento zeta a partir de Mp = exp(-zeta * pi / sqrt(1 - zeta^2))
            % ln(Mp) = -zeta * pi / sqrt(1 - zeta^2)
            ln_Mp = log(Mp);
            zeta = sqrt((ln_Mp^2) / (pi^2 + ln_Mp^2));

            % Frequência natural amortecida wd e não amortecida wn
            % t_pico_efetivo = pi / wd  =>  wd = pi / t_pico_efetivo
            wd = pi / t_pico_efetivo;
            wn = wd / sqrt(1 - zeta^2);

            sys.ordem = 2;
            sys.subtipo = 'subamortecido';
            sys.K = K;
            sys.zeta = zeta;
            sys.wn = wn;
            sys.wd = wd;
            sys.Mp = Mp * 100; % Em porcentagem
            sys.theta = theta;

            num_coef = [K * wn^2];
            den_coef = [1, 2*zeta*wn, wn^2];

            if theta > 0
                sys.str_tf = sprintf('G(s) = (%.4f / (s^2 + %.4f*s + %.4f)) * exp(-%.4f*s)', ...
                    K * wn^2, 2*zeta*wn, wn^2, theta);
            else
                sys.str_tf = sprintf('G(s) = %.4f / (s^2 + %.4f*s + %.4f)', ...
                    K * wn^2, 2*zeta*wn, wn^2);
            end

        case 'super'
            % Sistema Superamortecido (zeta >= 1) - Método dos 2 pontos (ex: 20% e 60%)
            % Entradas: t_20, t_60
            if length(varargin) < 2
                error('Para o caso superamortecido, informe t_20 e t_60.');
            end
            t_20 = varargin{1};
            t_60 = varargin{2};

            % Aproximação de Smith para sistemas de 2ª ordem superamortecidos
            % t20 e t60 em relação à variação total
            % tau1 + tau2 e tau1 * tau2 estimados a partir da curva
            % Usando a parametrização equivalente de 2ª ordem com zeta e wn:
            % t_60 - t_20 dá a dinâmica
            % Estimativa dos pólos e equivalente zeta/wn:

            tau_s = (t_60 - t_20) / 1.5;
            theta = max(0, t_60 - 2.0 * tau_s);

            % Para simplificação consistente de 2ª ordem com 2 pólos reais em tau_s
            wn = 1 / tau_s;
            zeta = 1.0; % Limite criticamente amortecido / superamortecido equivalente

            sys.ordem = 2;
            sys.subtipo = 'superamortecido';
            sys.K = K;
            sys.zeta = zeta;
            sys.wn = wn;
            sys.theta = theta;

            num_coef = [K * wn^2];
            den_coef = [1, 2*zeta*wn, wn^2];

            if theta > 0
                sys.str_tf = sprintf('G(s) = (%.4f / (s^2 + %.4f*s + %.4f)) * exp(-%.4f*s)', ...
                    K * wn^2, 2*zeta*wn, wn^2, theta);
            else
                sys.str_tf = sprintf('G(s) = %.4f / (s^2 + %.4f*s + %.4f)', ...
                    K * wn^2, 2*zeta*wn, wn^2);
            end

        otherwise
            error('Tipo desconhecido. Escolha ''sub'' para subamortecido ou ''super'' para superamortecido.');
    end

    try
        sys.tf = tf(num_coef, den_coef, 'InputDelay', theta);
    catch
        sys.tf = [];
    end

    % Exibir informações na tela
    fprintf('\n=== Identificação do Sistema de 2ª Ordem (%s) ===\n', sys.subtipo);
    fprintf('Ganho estático (K): %.4f\n', sys.K);
    fprintf('Fator de amortecimento (zeta): %.4f\n', sys.zeta);
    fprintf('Frequência natural (wn): %.4f rad/s\n', sys.wn);
    if isfield(sys, 'Mp')
        fprintf('Sobresinal (Mp): %.2f%%\n', sys.Mp);
    end
    fprintf('Atraso de transporte (theta): %.4f s\n', sys.theta);
    fprintf('Função de Transferência: %s\n\n', sys.str_tf);
end
