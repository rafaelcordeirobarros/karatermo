const endpoint_root = 'https://karatermo-api.onrender.com';
const endpoint_getTerms = endpoint_root + '/getTerms';
const endpoint_getResults = endpoint_root + '/getResults';
const endpoint_upsertResults = endpoint_root + '/upsertResults';

// Função para carregar os termos do arquivo JSON com cache em cookies de 1 dia
let terms;
async function loadTerms() {
    // Exibe o overlay de loading
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";
    
    if (terms) {
        loadingOverlay.style.display = "none"; // Oculta o loading
        return terms;
    }

    // Verifica se os termos estão no cookie
    const cachedTerms = getLocalStorage("terms");
    if (cachedTerms) {
        terms = cachedTerms;
        loadingOverlay.style.display = "none"; // Oculta o loading
        return terms;
    }

    try {
        const response = await fetch(endpoint_getTerms);
        if (!response.ok) throw new Error("Erro na requisição: " + response.status);

        terms = await response.json();
        console.log("Termos recebidos:", terms);

        // Armazena os termos em um cookie por 1 dia
        setLocalStorage("terms", terms, 1 * 24 * 60);
    } catch (error) {
        console.error("Erro ao buscar termos:", error);
    }

    // Oculta o overlay de loading ao finalizar
    loadingOverlay.style.display = "none";
    return terms;
}


function todayInBrazil(){
    // Create a new Date object with the current date and time
    let date = new Date();
    // Get the current time in milliseconds since January 1, 1970, 00:00:00 UTC
    let utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Create a new Date object for GMT-3
    let todayDate = new Date(utcTime - (3 * 3600000));

    return todayDate;
}


async function populateSelect(selectObjectId, options, onChangeFunction) {

    const selectObject = document.getElementById(selectObjectId);

    options.forEach(option => {
        const selectOption = document.createElement("option");
        selectOption.value = option.id;
        selectOption.textContent = option.label;
        selectObject.appendChild(selectOption);
    });

    selectObject.addEventListener("change", () => {
        onChangeFunction(selectObject.value);
    });

    // Define o conteúdo inicial
    onChangeFunction();
}