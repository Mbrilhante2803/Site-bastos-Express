document.addEventListener('DOMContentLoaded', () => {
    const reservaForm = document.getElementById('reservaForm');
    const mensagemReserva = document.getElementById('mensagemReserva');
    const onibusLayout = document.getElementById('onibusLayout');
    const passageirosInput = document.getElementById('passageiros');
    const inputAssentosSelecionados = document.getElementById('assentosSelecionados');

    let assentosSelecionados = [];

    // Gerar assentos
    if (onibusLayout) {
        const totalAssentos = 45; // 45 lugares fretamento Fly 12
        for (let i = 1; i <= totalAssentos; i++) {
            const divAssento = document.createElement('div');
            divAssento.classList.add('assento');
            divAssento.textContent = i;

            // Simular alguns assentos ocupados aleatoriamente
            if (Math.random() < 0.3) {
                divAssento.classList.add('ocupado');
            } else {
                divAssento.addEventListener('click', () => toggleAssento(divAssento, i));
            }
            onibusLayout.appendChild(divAssento);

            // Adicionar corredor após a 2ª poltrona de cada fileira de 4 (mas não na última fileira que tem 5)
            if (i < 41 && i % 2 === 0 && i % 4 !== 0) {
                const divCorredor = document.createElement('div');
                divCorredor.classList.add('corredor');
                onibusLayout.appendChild(divCorredor);
            }
        }
    }

    function toggleAssento(elemento, numero) {
        const maxPassageiros = parseInt(passageirosInput.value, 10);

        if (elemento.classList.contains('selecionado')) {
            elemento.classList.remove('selecionado');
            assentosSelecionados = assentosSelecionados.filter(n => n !== numero);
        } else {
            if (assentosSelecionados.length < maxPassageiros) {
                elemento.classList.add('selecionado');
                assentosSelecionados.push(numero);
            } else {
                alert(`Você só pode selecionar ${maxPassageiros} assento(s), conforme informado no campo "Número de Passageiros".`);
            }
        }
        inputAssentosSelecionados.value = assentosSelecionados.join(', ');
    }

    // Atualiza a seleção caso o número de passageiros diminua
    if (passageirosInput) {
        passageirosInput.addEventListener('change', (e) => {
             const max = parseInt(e.target.value, 10);
             if (assentosSelecionados.length > max) {
                 alert('Você reduziu o número de passageiros. Por favor, selecione seus assentos novamente.');
                 assentosSelecionados = [];
                 inputAssentosSelecionados.value = '';
                 document.querySelectorAll('.assento.selecionado').forEach(el => el.classList.remove('selecionado'));
             }
        });
    }

    if (reservaForm) {
        reservaForm.addEventListener('submit', function(event) {
            // Previne o envio padrão do formulário para tratar localmente
            event.preventDefault();

            // Pega os valores do formulário
            const origem = document.getElementById('origem').value;
            const destino = document.getElementById('destino').value;
            const dataIda = document.getElementById('dataIda').value;
            const passageiros = document.getElementById('passageiros').value;

            if(assentosSelecionados.length !== parseInt(passageiros, 10)) {
                alert(`Por favor, selecione exatamente ${passageiros} assento(s).`);
                return;
            }

            // Simula o processamento da reserva
            if (origem && destino && dataIda && passageiros) {
                const assentosMsg = assentosSelecionados.length > 0 ? `Assento(s): ${assentosSelecionados.join(', ')}.` : '';
                mensagemReserva.textContent = `Busca realizada com sucesso! Passagens reservadas de ${origem} para ${destino} na data ${dataIda} para ${passageiros} passageiro(s). ${assentosMsg} (Simulação local)`;
                mensagemReserva.className = 'mensagem-sucesso';

                // Limpa o formulário e os assentos
                reservaForm.reset();
                assentosSelecionados = [];
                inputAssentosSelecionados.value = '';
                document.querySelectorAll('.assento.selecionado').forEach(el => el.classList.remove('selecionado'));

                // Oculta a mensagem após 5 segundos
                setTimeout(() => {
                    mensagemReserva.className = 'mensagem-oculta';
                    mensagemReserva.textContent = '';
                }, 5000);
            }
        });
    }
});
