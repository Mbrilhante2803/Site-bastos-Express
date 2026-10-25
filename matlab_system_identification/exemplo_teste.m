% EXEMPLO_TESTE Script de teste e demonstração dos algoritmos de identificação
%
% Este script executa testes automáticos para validar as funções
% identificar_1a_ordem e identificar_2a_ordem com dados conhecidos.

fprintf('=======================================================\n');
fprintf(' EXECUTANDO TESTES DE IDENTIFICAÇÃO DE SISTEMAS (MATLAB)\n');
fprintf('=======================================================\n\n');

%% Teste 1: Sistema de 1ª ordem - Método 63.2%
% Sistema real: G(s) = 2 / (5*s + 1) * exp(-2*s) com degrau A = 1, y0 = 0
% k = 2, tau = 5, theta = 2
% t_63 = 2 + 5 = 7s
fprintf('[TESTE 1] Sistema de 1ª ordem (Método 63.2%%)\n');
sys1 = identificar_1a_ordem(1, 0, 2, '63', 7.0, 2.0);
assert(abs(sys1.K - 2) < 1e-4, 'Erro no cálculo do Ganho K');
assert(abs(sys1.tau - 5) < 1e-4, 'Erro no cálculo de Tau');
assert(abs(sys1.theta - 2) < 1e-4, 'Erro no cálculo de Theta');

%% Teste 2: Sistema de 1ª ordem - Método Smith (28.3% e 63.2%)
% Sistema real: G(s) = 3 / (10*s + 1) * exp(-1.5*s), degrau A = 2, y0 = 0
% K = 3 * 2 / 2 = 3 (y_final = 6)
% theta = 1.5, tau = 10
% t_28 = theta + 0.3328*tau = 1.5 + 3.328 = 4.828s
% t_63 = theta + tau = 11.5s
fprintf('[TESTE 2] Sistema de 1ª ordem (Método Smith)\n');
sys2 = identificar_1a_ordem(2, 0, 6, 'smith', 4.828, 11.5);
assert(abs(sys2.K - 3) < 1e-4, 'Erro no cálculo do Ganho K');
assert(abs(sys2.tau - 10) < 0.1, 'Erro no cálculo de Tau');

%% Teste 3: Sistema de 2ª ordem Subamortecido
% G(s) = 10 / (s^2 + 2*s + 25) => wn = 5 rad/s, zeta = 0.2, K = 10/25 = 0.4
% Degrau A = 1, y0 = 0, y_final = 0.4
% Sobresinal Mp = exp(-zeta*pi / sqrt(1 - zeta^2)) = exp(-0.2*pi / sqrt(0.96)) = 0.5266 (52.66%)
% y_pico = y_final * (1 + Mp) = 0.4 * 1.5266 = 0.6106
% t_pico = pi / (wn * sqrt(1 - zeta^2)) = pi / (5 * 0.9798) = 0.6413s
fprintf('[TESTE 3] Sistema de 2ª Ordem Subamortecido\n');
sys3 = identificar_2a_ordem(1, 0, 0.4, 'sub', 0.6106, 0.6413, 0);
assert(abs(sys3.K - 0.4) < 1e-4, 'Erro no cálculo do Ganho K');
assert(abs(sys3.zeta - 0.2) < 1e-2, 'Erro no cálculo de Zeta');
assert(abs(sys3.wn - 5) < 0.1, 'Erro no cálculo de Wn');

fprintf('=======================================================\n');
fprintf(' TODOS OS TESTES PASSARAM COM SUCESSO!\n');
fprintf('=======================================================\n');
