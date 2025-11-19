let rankingContainer = document.getElementById("ranking-content");


  // Função para atualizar o conteúdo
async function updateContent(selectedRanking) {

    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `<!-- Elemento "loading" que será exibido enquanto o ranking está sendo carregado -->
                            <div id="loading-ranking" class="loading" style="display: none;">
                                <i class="fas fa-spinner fa-spin loader"></i>
                                <p>Carregando ranking...</p>
                            </div>
                            <div class="podium">
                                <!-- As posições do pódio serão preenchidas dinamicamente via JavaScript -->
                            </div>
                            <div class="ranking-list">
                                <ul id="ranking-items">
                                    <!-- Os itens da lista serão preenchidos dinamicamente via JavaScript -->
                                </ul>
                            </div>`;

    await loadRankingContent(selectedRanking);
}


async function loadingRankingSelect() {

    rankingContainer = document.getElementById("ranking-content");
    rankingContainer.innerHTML = `<div class="select-container">
                                        <label for="rankingSelect"><i class="fas fa-trophy"></i></label>
                                        <select id="rankingSelect">
                                            <!-- Opções serão geradas dinamicamente pelo JavaScript -->
                                        </select>
                                    </div>
                                    <div id="content" class="content">
                                        <!-- Conteúdo inicial -->
                                    </div>`;


    // Estrutura de dados para as abas e seu conteúdo
    const optionsData = [
        { id: "generalRanking", label: "Geral", colorClass: "icon-geral"},
        { id: "Branca", label: "Branca", colorClass: "icon-branca"},
        { id: "Azul", label: "Azul", colorClass: "icon-azul"},
        { id: "Amarela", label: "Amarela", colorClass: "icon-amarela"},
        { id: "Vermelha", label: "Vermelha", colorClass: "icon-vermelha"},
        { id: "Laranja", label: "Laranja", colorClass: "icon-laranja"},
        { id: "Verde", label: "Verde", colorClass: "icon-verde"},
        { id: "Roxa", label: "Roxa", colorClass: "icon-roxa"},
        { id: "Marrom", label: "Marrom", colorClass: "icon-marrom"},
        { id: "Preta", label: "Preta", colorClass: "icon-preta" }
    ];
    
    // Inicializa o carrossel
    await populateSelect("rankingSelect", optionsData, updateContent);
    
}


async function loadRankingContent(selectedRanking){
    // Mostra o indicador de loading
    document.getElementById('loading-ranking').style.display = 'flex';

    try {
        if (!selectedRanking){

            selectedRanking = "generalRanking";
            
            await fetch(endpoint_getResults)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na requisição: ' + response.status);
                    }
                    return response.json();
                })
                .then(response => {
                    console.log('resultados recebidos:', response.data);
                    rankingData = response  .data;
                })
                .catch(error => {
                    console.error('Erro ao buscar termos:', error);
                });
        }

        // Filtrar os resultados para manter apenas o último resultado de cada jogador (identificado por email)
        const latestResults = Object.values(
            rankingData
                .filter(player => selectedRanking == "generalRanking" || player.player.belt == selectedRanking)
                .reduce((acc, player) => {
                    const email = player.player.email.toLowerCase();
                    const latestResult = player.results.reduce((latest, current) => {
                        return current.reportDateTime > latest.reportDateTime ? current : latest;
                    });

                    // Se o email ainda não existe OU se o resultado atual é mais recente
                    if (!acc[email] || latestResult.reportDateTime > acc[email].results[0].reportDateTime) {
                        acc[email] = { player: player.player, results: [latestResult] };
                    }

                    return acc;
                }, {})
        );

        // Ordena os jogadores com base na pontuação e critérios de desempate
        latestResults.sort((a, b) => {
            if (b.results[0].score !== a.results[0].score) {
                return b.results[0].score - a.results[0].score; // Pontuação
            } else if (b.results[0].totalCorrect !== a.results[0].totalCorrect) {
                return b.results[0].totalCorrect - a.results[0].totalCorrect; // Total correto
            } else if (b.results[0].accuracy !== a.results[0].accuracy) {
                return b.results[0].accuracy - a.results[0].accuracy; // Precisão
            } else if (b.results[0].totalAttempts !== a.results[0].totalAttempts) {
                return a.results[0].totalAttempts - b.results[0].totalAttempts; // Total de tentativas (menor é melhor)
            } else if (b.results[0].averageTime !== a.results[0].averageTime) {
                return a.results[0].averageTime - b.results[0].averageTime; // Tempo médio (menor é melhor)
            } else {
                return a.results[0].totalTimeSpent - b.results[0].totalTimeSpent; // Tempo total gasto (menor é melhor)
            }
        });

        // Atualiza o conteúdo do modal
        const podium = document.querySelector('.podium');
        const rankingList = document.getElementById('ranking-items');
        
        // Limpa o conteúdo anterior
        podium.innerHTML = '';
        rankingList.innerHTML = '';

        if (!latestResults || latestResults.length === 0) {
            podium.innerHTML = 'Nenhum resultado foi enviado. Seja o primeiro e envie suas estatísticas.';
        }

        // Atualiza o pódio e a lista de ranking
        latestResults.forEach((player, index) => {
            // Pódio
            if (index < 3) {
                const podiumPlace = document.createElement('div');
                podiumPlace.className = `podium-place ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`;
                podiumPlace.innerHTML = `
                    <div class="player-name">${player.player.name}</div>
                    <div class="score">${player.results[0].score} pontos</div>
                    <div class="place-number">${index + 1}</div>
                `;
                podium.appendChild(podiumPlace);
            }

            // Lista de ranking
            const listItem = document.createElement('li');
            const accuracyPercent = (player.results[0].accuracy).toFixed(0);
            const averageTime = player.results[0].averageTime;
            const positionIcon = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

            listItem.innerHTML = `
                <span class="position ${positionIcon}">${index < 3 ? `<i class="fas fa-medal"></i> ${index + 1}º` : index + 1}</span> 
                <strong>${player.player.name}</strong>: ${player.results[0].score} pontos 
                <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                <div class="collapsible" style="display: none;">
                    <div class="collapsible-content">
                        <span><b>Total Corretos:</b> ${player.results[0].totalCorrect}</span> | 
                        <span><b>Precisão:</b> ${accuracyPercent}%</span> | 
                        <span><b>Total de Tentativas:</b> ${player.results[0].totalAttempts}</span> | 
                        <span><b>Tempo Médio:</b> ${(averageTime).toFixed(2)} seg</span> | 
                        <span><b>Tempo Total:</b> ${formatTime(player.results[0].totalTimeSpent / 60)}</span>
                    </div>
                </div>
            `;
            rankingList.appendChild(listItem);

            // Evento para colapsar os critérios de desempate
            listItem.querySelector('.expand-icon').onclick = () => {
                const collapsible = listItem.querySelector('.collapsible');
                const icon = listItem.querySelector('.expand-icon i');
                if (collapsible.style.display === 'block') {
                    collapsible.style.display = 'none';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    collapsible.style.display = 'block';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            };
        });
    } catch (error) {
        console.error('Erro ao carregar o ranking:', error);
    } finally {
        // Esconde o indicador de loading
        document.getElementById('loading-ranking').style.display = 'none';
    }
}

