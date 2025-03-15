const quizData = [
    {"_id":{"$oid":"671d954d8bbfc040a8eefc6c"},"term":"Sensei","meaning":"O professor ou instrutor que guia e ensina os estudantes de Karate.","question":{"questionText":"Qual é o título dado ao instrutor ou professor de Karate?","choices":["Sensei","Senpai","Dojo","Sempai"],"correctAnswer":"Sensei"}},
    {"_id":{"$oid":"671d954d8bbfc040a8eefc69"},"term":"Oi-zuki","meaning":"Soco executado enquanto o praticante avança em direção ao oponente.","question":{"questionText":"Qual é o nome do soco executado enquanto se avança em direção ao oponente?","choices":["Oi-zuki","Kizami-zuki","Jodan-uke","Gyaku-zuki"],"correctAnswer":"Oi-zuki"}}
];

let currentQuestionIndex = 0;
let score = 0;

const container = document.getElementById("quiz-container");

function showQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }
    
    const questionData = quizData[currentQuestionIndex];
    container.innerHTML = `
        <div class="question">
            <p>${questionData.question.questionText}</p>
            <ul>
                ${questionData.question.choices.map(choice => `
                    <li><button class="choice-btn" onclick="selectAnswer('${choice}')">${choice}</button></li>
                `).join('')}
            </ul>
        </div>
    `;
}

function selectAnswer(choice) {
    if (choice === quizData[currentQuestionIndex].question.correctAnswer) {
        score++;
    }
    currentQuestionIndex++;
    showQuestion();
}

function showResults() {
    container.innerHTML = `
        <div class="results">
            <h2>Quiz Finalizado!</h2>
            <p>Você acertou ${score} de ${quizData.length} perguntas.</p>
        </div>
    `;
}

showQuestion();
