# Modelagem de Sistemas de 1ª e 2ª Ordem em MATLAB

Este projeto contém um programa computacional desenvolvido em **MATLAB / Octave** para sistematizar o processo de modelagem de sistemas dinâmicos de 1ª ordem e 2ª ordem a partir de suas respostas ao degrau.

---

## 📁 Estrutura da Pasta

```
matlab_system_identification/
├── identificar_1a_ordem.m   # Função para identificação de sistemas de 1ª ordem
├── identificar_2a_ordem.m   # Função para identificação de sistemas de 2ª ordem
├── modelagem_sistemas.m     # Script interativo principal
├── exemplo_teste.m          # Script de testes e validação automática
└── README.md                # Documentação do projeto
```

---

## 🚀 Como Executar

1. Abra o MATLAB ou GNU Octave.
2. Navegue até a pasta `matlab_system_identification/`:
   ```matlab
   cd('matlab_system_identification')
   ```
3. Execute o script principal interativo:
   ```matlab
   modelagem_sistemas
   ```
4. Siga as instruções do menu no terminal digitando os parâmetros da resposta ao degrau medida.

Para rodar os testes automatizados com exemplos numéricos conhecidos:
```matlab
exemplo_teste
```

---

## 📐 Métodos de Identificação Suportados

### 1. Sistemas de 1ª Ordem com Atraso de Transporte
Função de Transferência:
$$G(s) = \frac{K}{\tau s + 1} e^{-\theta s}$$

- **Método dos 63,2%**: Utiliza o ponto de $63,2\%$ da variação de saída e o tempo morto $\theta$.
- **Método dos 2 Pontos de Smith**: Utiliza os pontos $t_{28,3\%}$ e $t_{63,2\%}$ para calcular $\tau = 1,5(t_{63} - t_{28})$ e $\theta = t_{63} - \tau$.
- **Método de Sundaresan**: Utiliza os pontos $t_{35,3\%}$ e $t_{85,3\%}$ para estipular a constante de tempo e o atraso de transporte.

### 2. Sistemas de 2ª Ordem

#### Subamortecidos ($0 < \zeta < 1$)
Função de Transferência:
$$G(s) = \frac{K \omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2} e^{-\theta s}$$

Utiliza o sobresinal relativo ($M_p$) e o tempo de pico ($t_p$):
- $K = \frac{\Delta y}{\Delta u}$
- $\ln(M_p) = \frac{-\zeta \pi}{\sqrt{1 - \zeta^2}} \implies \zeta = \sqrt{\frac{\ln^2(M_p)}{\pi^2 + \ln^2(M_p)}}$
- $\omega_d = \frac{\pi}{t_p - \theta}$
- $\omega_n = \frac{\omega_d}{\sqrt{1 - \zeta^2}}$

#### Superamortecidos ($\zeta \ge 1$)
Modelado com aproximadores de Smith baseados nos tempos de $20\%$ e $60\%$ da resposta ao degrau.

---

## 🛠️ Requisitos
- MATLAB (com ou sem Control System Toolbox) ou GNU Octave.
