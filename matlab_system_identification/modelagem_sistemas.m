function sys = modelagem_sistemas()
% MODELAGEM_SISTEMAS Programa computacional interativo para modelagem de
% sistemas de 1ª ou 2ª ordem a partir de suas respostas ao degrau.
%
% Desenvolvido para MATLAB / Octave.

    clc;
    fprintf('=================================================================\n');
    fprintf(' PROGRAMA COMPUTACIONAL DE MODELAGEM DE SISTEMAS (1ª E 2ª ORDEM)\n');
    fprintf('=================================================================\n\n');

    fprintf('Selecione a ordem do sistema para modelagem:\n');
    fprintf('1 - Sistema de 1ª Ordem (G(s) = K / (tau*s + 1) * exp(-theta*s))\n');
    fprintf('2 - Sistema de 2ª Ordem Subamortecido (G(s) = K*wn^2 / (s^2 + 2*zeta*wn*s + wn^2) * exp(-theta*s))\n');
    fprintf('3 - Sistema de 2ª Ordem Superamortecido\n');

    opcao = input('Digite a opção desejada (1, 2 ou 3): ');

    A = input('Informe a amplitude do degrau de entrada (Delta u) [Ex: 1]: ');
    y0 = input('Informe o valor inicial da saída y(0) [Ex: 0]: ');
    y_final = input('Informe o valor final da saída em regime permanente y_final [Ex: 2]: ');

    switch opcao
        case 1
            fprintf('\n--- Métodos para 1ª Ordem ---\n');
            fprintf('1 - Método dos 63.2%%\n');
            fprintf('2 - Método dos 2 pontos de Smith (28.3%% e 63.2%%)\n');
            fprintf('3 - Método de Sundaresan (35.3%% e 85.3%%)\n');
            met_op = input('Escolha o método (1, 2 ou 3): ');

            if met_op == 1
                t_63 = input('Informe o tempo t_63 (onde y atinge 63.2%% da variação): ');
                t_atraso = input('Informe o tempo morto / atraso de transporte theta (0 se não houver): ');
                sys = identificar_1a_ordem(A, y0, y_final, '63', t_63, t_atraso);
            elseif met_op == 2
                t_28 = input('Informe o tempo t_28 (onde y atinge 28.3%% da variação): ');
                t_63 = input('Informe o tempo t_63 (onde y atinge 63.2%% da variação): ');
                sys = identificar_1a_ordem(A, y0, y_final, 'smith', t_28, t_63);
            elseif met_op == 3
                t_35 = input('Informe o tempo t_35 (onde y atinge 35.3%% da variação): ');
                t_85 = input('Informe o tempo t_85 (onde y atinge 85.3%% da variação): ');
                sys = identificar_1a_ordem(A, y0, y_final, 'sundaresan', t_35, t_85);
            else
                error('Opção de método inválida.');
            end

        case 2
            fprintf('\n--- Sistema de 2ª Ordem Subamortecido ---\n');
            y_pico = input('Informe o valor de pico y_pico (máximo valor atingido): ');
            t_pico = input('Informe o tempo de pico t_pico: ');
            t_atraso = input('Informe o tempo de atraso/médio theta (0 se não houver): ');

            sys = identificar_2a_ordem(A, y0, y_final, 'sub', y_pico, t_pico, t_atraso);

        case 3
            fprintf('\n--- Sistema de 2ª Ordem Superamortecido ---\n');
            t_20 = input('Informe o tempo t_20 (onde y atinge 20%% da variação): ');
            t_60 = input('Informe o tempo t_60 (onde y atinge 60%% da variação): ');

            sys = identificar_2a_ordem(A, y0, y_final, 'super', t_20, t_60);

        otherwise
            error('Opção inválida.');
    end

    % Gerar e Plotar Resposta do Modelo se o objeto de Transfer Function estiver disponível
    if ~isempty(sys.tf)
        try
            figure('Name', 'Resposta ao Degrau - Modelo Identificado');
            step(A * sys.tf);
            hold on;
            grid on;
            title(sprintf('Resposta ao Degrau do Modelo Identificado\n%s', sys.str_tf));
            xlabel('Tempo (segundos)');
            ylabel('Saída y(t)');
        catch
            % Se step não for suportado sem a toolbox
        end
    end
end
