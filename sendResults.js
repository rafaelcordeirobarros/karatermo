document.addEventListener("DOMContentLoaded", () => {
    loadFormData();
    document.getElementById("ranking-form").addEventListener("submit", saveStats);
});

function saveStats(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const belt = document.getElementById("belt").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const userData = { name, belt, email, password };

    const lastResult = { player: userData, results: [getResults()]};

    sendResults(lastResult);
    closeModal('send-stats-modal');
}

function getResults() {
    const results = JSON.parse(localStorage.getItem("karatermoResults")) || [];
    const totalTerms = results.length;
    const totalCorrect = results.filter(result => result.correct).length;
    const totalAttempts = results.reduce((sum, result) => sum + result.attempts, 0);
    const totalTimeSpent = results.reduce((sum, result) => sum + result.totalTime, 0);
    const averageTime = totalTimeSpent > 0 ? totalTimeSpent / totalTerms : 0;
    const accuracy = totalCorrect > 0 ? (totalCorrect / totalTerms) * 100 : 0;

    // Calcula a pontuação com a regra ajustada para redução a cada 10 segundos
    const rawScore = (1000 * (accuracy / 100)) - (averageTime / 10);
    const score = Math.max(0, Math.round(rawScore)); // Ajusta para zero caso seja negativo
    console.log({ reportDateTime: (new Date()).totalTime, score, accuracy, averageTime,totalAttempts, totalCorrect, totalTerms, totalTimeSpent } );
    const time = todayInBrazil().getTime();
    console.log(time);
    return { reportDateTime: time, score, accuracy, averageTime,totalAttempts, totalCorrect, totalTerms, totalTimeSpent }   
}


async function sendResults(lastResult) {
    
    const existingPlayer = await loadPlayerResult(lastResult.player.email);

    if (existingPlayer && existingPlayer.player.password != lastResult.player.password){
        alert('Não foi possível enviar. Verifique se seu e-mail e senha estão corretos e tente novamente.');
        return;
    }else if(existingPlayer){
        existingPlayer.player.name = lastResult.player.name;
        existingPlayer.player.belt = lastResult.player.belt;
        existingPlayer.results = lastResult.results;
    }

    const apiUrl = "https://karatermo-api.onrender.com/upsertResults";

    await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(existingPlayer ?? lastResult),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Dados enviados com sucesso:", data);
        lastResult = data;
    })
    .catch(error => {
        console.error("Erro ao enviar dados:", error);
        alert("Ocorreu um erro ao enviar as estatísticas para o ranking. Tente novamente.");
    });

    localStorage.setItem("karatermoPlayer", JSON.stringify(lastResult));
}

// Função para carregar os termos do arquivo JSON

async function loadPlayerResult(email) {

    let playerResult;
    await fetch(`https://karatermo-api.onrender.com/getResultByMail/${encodeURIComponent(email)}`)
    .then(response => {
        if (!response.ok) {
        throw new Error('Erro na requisição: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('jogador carregado:', data);
        playerResult = data;
        // Aqui você pode manipular os dados, como exibir na interface do usuário
    })
    .catch(error => {
        console.error('Erro ao buscar termos:', error);
    });

    return playerResult;
}

function loadFormData() {
    const storedData = JSON.parse(localStorage.getItem("karatermoPlayer"));
    console.log(storedData);
    if (storedData) {
        document.getElementById("name").value = storedData.player.name;
        document.getElementById("belt").value = storedData.player.belt;
        document.getElementById("email").value = storedData.player.email;
    }
}